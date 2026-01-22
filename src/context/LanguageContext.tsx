'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'am' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
    en: {
        menu: 'Menu',
        search: 'Search dishes...',
        addToCart: 'Add to Cart',
        viewCart: 'View Cart',
        orderNow: 'Order Now',
        total: 'Total',
        table: 'Table',
        fasting: 'Fasting',
        fastingMode: 'Fasting Mode',
        allDishes: 'All Dishes',
        popular: 'Popular',
        chefSpecial: "Chef's Special",
        available: 'Available',
        unavailable: 'Unavailable',
        notes: 'Special instructions...',
        confirmOrder: 'Confirm Order',
        orderSuccess: 'Order Sent!',
        orderSuccessDesc: 'Your order has been sent to the kitchen',
        category: 'Category',
        price: 'Price',
        quantity: 'Quantity',
        remove: 'Remove',
        cart: 'Cart',
        emptyCart: 'Your cart is empty',
        continueShopping: 'Continue Shopping',
        orderPlaced: 'Order Placed',
        ingredients: 'Ingredients',
        allergens: 'Allergens',
        nutrition: 'Nutrition',
        pairsWellWith: 'Pairs Well With',
        viewInAR: 'View in AR',
        allFoods: 'All Foods',
        mainMenu: 'Main Menu',
        all: 'All',
    },
    am: {
        menu: 'ምናሌ',
        search: 'ምግቦችን ይፈልጉ...',
        addToCart: 'ወደ ቅርጫት ጨምር',
        viewCart: 'ቅርጫት ይመልከቱ',
        orderNow: 'አሁን ይዘዙ',
        total: 'ጠቅላላ',
        table: 'ጠረጴዛ',
        fasting: 'ፆም',
        fastingMode: 'የፆም ሁነታ',
        allDishes: 'ሁሉም ምግቦች',
        popular: 'ተወዳጅ',
        chefSpecial: 'የምግብ አብሳይ ልዩ',
        available: 'ይገኛል',
        unavailable: 'አይገኝም',
        notes: 'ልዩ መመሪያዎች...',
        confirmOrder: 'ትዕዛዝ አረጋግጥ',
        orderSuccess: 'ትዕዛዝ ተልኳል!',
        orderSuccessDesc: 'ትዕዛዝዎ ወደ ወጥ ቤት ተልኳል',
        category: 'ምድብ',
        price: 'ዋጋ',
        quantity: 'ብዛት',
        remove: 'አስወግድ',
        cart: 'ቅርጫት',
        emptyCart: 'ቅርጫትዎ ባዶ ነው',
        continueShopping: 'መግዛትዎን ይቀጥሉ',
        orderPlaced: 'ትዕዛዝ ተቀምጧል',
        ingredients: 'ንጥረ ነገሮች',
        allergens: 'አለርጂዎች',
        nutrition: 'የአመጋገብ መረጃ',
        pairsWellWith: 'ጋር ይስማማል',
        viewInAR: 'በ AR ይመልከቱ',
        allFoods: 'ሁሉም ምግቦች',
        mainMenu: 'ዋና ምናሌ',
        all: 'ሁሉም',
    },
    ar: {
        menu: 'القائمة',
        search: 'البحث عن الأطباق...',
        addToCart: 'أضف إلى السلة',
        viewCart: 'عرض السلة',
        orderNow: 'اطلب الآن',
        total: 'المجموع',
        table: 'الطاولة',
        fasting: 'صيام',
        fastingMode: 'وضع الصيام',
        allDishes: 'جميع الأطباق',
        popular: 'شائع',
        chefSpecial: 'خاص الطاهي',
        available: 'متاح',
        unavailable: 'غير متاح',
        notes: 'تعليمات خاصة...',
        confirmOrder: 'تأكيد الطلب',
        orderSuccess: 'تم إرسال الطلب!',
        orderSuccessDesc: 'تم إرسال طلبك إلى المطبخ',
        category: 'الفئة',
        price: 'السعر',
        quantity: 'الكمية',
        remove: 'إزالة',
        cart: 'السلة',
        emptyCart: 'سلتك فارغة',
        continueShopping: 'مواصلة التسوق',
        orderPlaced: 'تم الطلب',
        ingredients: 'المكونات',
        allergens: 'المواد المسببة للحساسية',
        nutrition: 'التغذية',
        pairsWellWith: 'يتماشى مع',
        viewInAR: 'عرض في AR',
        allFoods: 'جميع الأطعمة',
        mainMenu: 'القائمة الرئيسية',
        all: 'الكل',
    },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const stored = localStorage.getItem('language') as Language;
        if (stored && ['en', 'am', 'ar'].includes(stored)) {
            setLanguageState(stored);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
