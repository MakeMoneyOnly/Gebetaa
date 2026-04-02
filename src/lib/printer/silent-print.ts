import { encodeReceiptToEscPos, type EscPosReceiptPayload } from '@/lib/printer/escpos';
import {
    getStoredPrinterSelection,
    storePrinterSelection,
    type StoredPrinterSelection,
} from '@/lib/mobile/device-storage';
import { isCapacitorNativeRuntime } from '@/lib/mobile/capacitor';

export interface SilentPrintResult {
    ok: boolean;
    channel: 'native' | 'browser-fallback' | 'queue';
    printer?: StoredPrinterSelection | null;
    reason?: string;
}

function toBase64(bytes: Uint8Array): string {
    if (typeof window === 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }

    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
}

function getNativePrinterPlugin(): Record<string, any> | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const capacitor = (window as typeof window & { Capacitor?: any }).Capacitor;
    return capacitor?.Plugins?.ThermalPrinter ?? capacitor?.Plugins?.PrinterBridge ?? null;
}

export async function rememberPrinterSelection(selection: StoredPrinterSelection): Promise<void> {
    await storePrinterSelection(selection);
}

export async function discoverNativePrinters(): Promise<StoredPrinterSelection[]> {
    const plugin = getNativePrinterPlugin();
    if (!plugin?.discover) {
        return [];
    }

    const response = await plugin.discover();
    const printers = Array.isArray(response?.printers) ? response.printers : [];
    return printers.map((printer: Record<string, unknown>) => ({
        connection_type:
            (printer.connection_type as StoredPrinterSelection['connection_type']) ?? 'bluetooth',
        device_id: String(printer.device_id ?? printer.id ?? ''),
        device_name: String(printer.device_name ?? printer.name ?? ''),
        mac_address: printer.mac_address !== undefined ? String(printer.mac_address) : null,
    }));
}

export async function silentPrintReceipt(
    receipt: EscPosReceiptPayload,
    printerSelection?: StoredPrinterSelection | null
): Promise<SilentPrintResult> {
    const bytes = await encodeReceiptToEscPos(receipt);
    const selectedPrinter = printerSelection ?? (await getStoredPrinterSelection());

    if (!isCapacitorNativeRuntime()) {
        return {
            ok: false,
            channel: 'browser-fallback',
            printer: selectedPrinter,
            reason: 'native_runtime_unavailable',
        };
    }

    const plugin = getNativePrinterPlugin();
    if (!plugin) {
        return {
            ok: false,
            channel: 'queue',
            printer: selectedPrinter,
            reason: 'native_printer_plugin_missing',
        };
    }

    if (typeof plugin.printRaw === 'function') {
        await plugin.printRaw({
            payload: toBase64(bytes),
            encoding: 'base64',
            connectionType: selectedPrinter?.connection_type,
            deviceId: selectedPrinter?.device_id,
            macAddress: selectedPrinter?.mac_address,
        });
    } else if (typeof plugin.print === 'function') {
        await plugin.print({
            payload: Array.from(bytes),
            connectionType: selectedPrinter?.connection_type,
            deviceId: selectedPrinter?.device_id,
            macAddress: selectedPrinter?.mac_address,
        });
    } else {
        return {
            ok: false,
            channel: 'queue',
            printer: selectedPrinter,
            reason: 'native_printer_plugin_no_supported_method',
        };
    }

    return {
        ok: true,
        channel: 'native',
        printer: selectedPrinter,
    };
}
