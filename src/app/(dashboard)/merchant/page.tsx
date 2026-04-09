import React from 'react';
import { 
  SlidersHorizontal, LayoutDashboard, ChevronDown, 
  Info, ArrowUp, ArrowDown, ArrowRight, MoreHorizontal, Users, 
  Plus, Trello
} from 'lucide-react';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { SalesPerformanceChart } from '@/components/merchant/SalesPerformanceChart';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Partner';
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  
  const hour = new Date().getHours();
  let timeGreeting = 'Welcome';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  const greeting = `${timeGreeting}, ${name}!`;

  const topItems = [
    { name: 'Gebeta Platters', sales: 127, rev: 'Br. 1,890', stock: '120', status: 'In Stock', statusColor: 'bg-indigo-50 text-indigo-600' },
    { name: 'Doro Wot', sales: 540, rev: 'Br. 2,889', stock: '100', status: 'Out of stock', statusColor: 'bg-red-50 text-red-500' }
  ];

  return (
    <div className="flex min-h-full w-full flex-col bg-white py-4 lg:py-6 tracking-[-0.07em]">
      
      {/* Page Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
        <div className="pl-5">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h1>
            <p className="text-sm text-gray-500">Here is how your restaurant is performing today.</p>
        </div>
        <div className="flex items-center gap-3 pr-5">
              <button className="flex items-center gap-2 h-11 bg-gray-50 hover:bg-gray-100 px-5 rounded-xl text-sm font-bold text-gray-700 transition-colors outline-none">
                  <SlidersHorizontal strokeWidth={2} className="w-4 h-4" />
                  Filters
              </button>
              <button className="flex items-center gap-2 h-11 bg-gray-900 hover:bg-black text-white px-5 rounded-xl text-sm font-bold transition-all outline-none">
                  <LayoutDashboard strokeWidth={2} className="w-4 h-4" />
                  Add Widget
              </button>
          </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
          
          {/* Row 1: Top Metrics */}
          <div className="col-span-1 lg:col-span-6 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between min-h-[200px]">
              <div className="flex justify-between items-center h-11 mb-0 -mt-2.5">
                  <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium text-gray-400">Product overview</h3>
                      <Info strokeWidth={1.5} className="w-4 h-4 text-gray-300" />
                  </div>
                  <button className="flex items-center gap-1 h-11 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 text-sm font-bold text-gray-700 transition-colors outline-none">
                      This month
                      <ChevronDown strokeWidth={2} className="w-3.5 h-3.5 text-gray-400" />
                  </button>
              </div>
              <div className="flex items-baseline gap-1.5 -mt-2">
                  <span className="text-3xl font-normal text-gray-400">Br.</span>
                  <span className="text-3xl font-bold text-black">43,630</span>
                  <span className="text-sm font-medium text-gray-400 ml-2">Total sales</span>
              </div>
              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">Select by product</span>
                    <span className="text-sm font-medium text-gray-400">New sales: <span className="text-gray-900 font-semibold">453</span> <ChevronDown strokeWidth={2} className="inline w-3.5 h-3.5 ml-0.5" /></span>
                </div>
                <div className="flex gap-1">
                    <button className="flex-1 h-11 bg-brand-accent text-gray-900 rounded-xl px-4 flex items-center justify-between text-xs font-bold shadow-sm transition-transform hover:scale-[0.99] active:scale-[0.97] outline-none relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,1)_50%,rgba(255,255,255,1)_75%,transparent_75%,transparent)] bg-size-[4px_4px]"></div>
                        <span className="relative z-10">Gebeta Food</span>
                        <div className="relative z-10 w-4 h-4 rounded-full bg-black/5 flex items-center justify-center">
                            <Info strokeWidth={2.5} className="w-2.5 h-2.5 text-black" />
                        </div>
                    </button>
                    <button className="flex-1 h-11 bg-brand-accent/20 text-gray-700/60 rounded-xl px-4 flex items-center justify-between text-xs font-bold hover:bg-brand-accent/30 transition-all active:scale-[0.97] outline-none relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,1)_50%,rgba(255,255,255,1)_75%,transparent_75%,transparent)] bg-size-[4px_4px]"></div>
                        <span className="relative z-10">Table Service</span>
                        <div className="relative z-10 w-4 h-4 rounded-full bg-gray-400/10 flex items-center justify-center">
                            <Info strokeWidth={2.5} className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                    </button>
                    <button className="flex-1 h-11 bg-brand-accent/[0.07] text-gray-400 rounded-xl px-4 flex items-center justify-between text-xs font-bold hover:bg-brand-accent/12 transition-all active:scale-[0.97] outline-none relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,1)_50%,rgba(255,255,255,1)_75%,transparent_75%,transparent)] bg-size-[4px_4px]"></div>
                        <span className="relative z-10 truncate">Delivery</span>
                        <div className="relative z-10 w-4 h-4 rounded-full bg-gray-400/5 flex items-center justify-center">
                            <Info strokeWidth={2.5} className="w-2.5 h-2.5 text-gray-300" />
                        </div>
                    </button>
                </div>
              </div>
          </div>

          {/* Combined Sales & Revenue Card */}
          <div className="col-span-1 lg:col-span-6 bg-white border border-gray-100 rounded-3xl flex flex-col min-h-[200px]">
              <div className="flex flex-1">
                  {/* Active Sales Half */}
                  <div className="flex-1 p-6 flex flex-col border-r border-gray-50">
                      <div>
                          <div className="flex items-center gap-2 h-11 mb-0 -mt-2.5">
                              <h3 className="text-base font-medium text-gray-400">Active sales</h3>
                              <Info strokeWidth={1.5} className="w-4 h-4 text-gray-300" />
                          </div>
                          
                          <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-2">
                                  <div className="flex items-baseline gap-1.5 -mt-2">
                                    <span className="text-3xl font-normal text-gray-400">Br.</span>
                                    <span className="text-3xl font-bold text-black">27,064</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                                      vs last month
                                      <span className="flex items-center gap-0.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                          <ArrowUp strokeWidth={2.5} className="w-2.5 h-2.5" /> 12%
                                      </span>
                                  </div>
                              </div>
                              <div className="flex items-end gap-1.5 h-10">
                                  <div className="w-2 h-4 bg-brand-accent/30 rounded-t-sm"></div>
                                  <div className="w-2 h-9 bg-brand-accent rounded-t-sm"></div>
                                  <div className="w-2 h-5 bg-brand-accent/30 rounded-t-sm"></div>
                                  <div className="w-2 h-3 bg-brand-accent/30 rounded-t-sm"></div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Product Revenue Half */}
                  <div className="flex-1 p-6 flex flex-col">
                      <div>
                          <div className="flex items-center gap-2 h-11 mb-0 -mt-2.5">
                              <h3 className="text-base font-medium text-gray-400">Product Revenue</h3>
                              <Info strokeWidth={1.5} className="w-4 h-4 text-gray-300" />
                          </div>

                          <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-2">
                                  <div className="flex items-baseline gap-1.5 -mt-2">
                                    <span className="text-3xl font-normal text-gray-400">Br.</span>
                                    <span className="text-3xl font-bold text-black">16,568</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                                      vs last month
                                      <span className="flex items-center gap-0.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                          <ArrowUp strokeWidth={2.5} className="w-2.5 h-2.5" /> 7%
                                      </span>
                                  </div>
                              </div>
                              <div className="w-10 h-10 rounded-full border-[4px] border-brand-accent/10 relative">
                                  <div className="absolute inset-[-4px] rounded-full border-[4px] border-transparent border-t-brand-accent border-r-brand-accent rotate-45"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="flex border-t border-gray-50">
                  <button className="flex-1 py-3 text-xs font-bold text-gray-400/80 hover:text-gray-900 flex justify-center items-center gap-2 rounded-bl-3xl hover:bg-gray-50 transition-all outline-none border-r border-gray-50 opacity-80 hover:opacity-100">
                      See details <ArrowRight strokeWidth={2} className="w-3.5 h-3.5" />
                  </button>
                  <button className="flex-1 py-3 text-xs font-bold text-gray-400/80 hover:text-gray-900 flex justify-center items-center gap-2 rounded-br-3xl hover:bg-gray-50 transition-all outline-none opacity-80 hover:opacity-100">
                      See details <ArrowRight strokeWidth={2} className="w-3.5 h-3.5" />
                  </button>
              </div>
          </div>


          {/* Row 2: Charts */}
          <div className="col-span-1 lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-8 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-400">Analytics</h3>
                      <Info strokeWidth={1.5} className="w-4.5 h-4.5 text-gray-300" />
                  </div>
                  <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1 h-11 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 text-sm font-bold text-gray-700 transition-colors outline-none">
                          This year
                          <ChevronDown strokeWidth={2} className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button className="flex items-center gap-2 h-11 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 text-sm font-bold text-gray-700 transition-colors outline-none">
                          <SlidersHorizontal strokeWidth={2} className="w-3.5 h-3.5" />
                          Filters
                      </button>
                  </div>
              </div>

              <div className="flex justify-between items-end mb-10 relative z-10 px-2">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] font-normal text-gray-400">Br.</span>
                        <span className="text-[32px] font-bold text-black">-4,543</span>
                        <div className="text-red-500 bg-red-50 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ml-1.5">
                          <ArrowDown strokeWidth={2.5} className="w-2.5 h-2.5" /> 0.4%
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">Total sales</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-gray-900">0.73%</span>
                        <div className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <ArrowUp strokeWidth={2.5} className="w-2.5 h-2.5" /> 13%
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400 text-right">Conv. rate</span>
                  </div>
              </div>

              <div className="h-[320px] w-full mt-6 relative">
                  <RevenueChart data={[
                    { label: 'JAN', income: 450, previous: 400 },
                    { label: 'FEB', income: 500, previous: 480 },
                    { label: 'MAR', income: 800, previous: 600 },
                    { label: 'APR', income: 700, previous: 650 },
                    { label: 'MAY', income: 1200, previous: 900 },
                    { label: 'JUN', income: 1000, previous: 850 },
                    { label: 'JUL', income: 1100, previous: 950 },
                    { label: 'AUG', income: 900, previous: 800 },
                  ]} />
              </div>
          </div>

          <div className="col-span-1 lg:col-span-4 bg-white border border-gray-100 rounded-3xl flex flex-col justify-between min-h-[500px]">
              <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-8">
                      <h3 className="text-lg font-medium text-gray-400">Sales Performance</h3>
                      <Info strokeWidth={1.5} className="w-4 h-4 text-gray-300" />
                  </div>
                  
                  <div className="relative w-full aspect-square grow flex items-center justify-center">
                      <div className="absolute inset-0">
                          <SalesPerformanceChart totalSales={75} averageSales={40} />
                      </div>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-36">
                          <div className="flex items-center gap-2">
                              <span className="text-display-2 font-bold text-gray-900">17.9%</span>
                              <div className="bg-green-500 rounded-full p-1 shadow-sm flex items-center justify-center">
                                <ArrowUp strokeWidth={3} className="w-3.5 h-3.5 text-white" />
                              </div>
                          </div>
                          <span className="text-sm font-medium text-gray-400 mt-1">Since yesterday</span>
                      </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-3 text-gray-400/80">
                              <div className="w-4 h-1.5 bg-brand-accent rounded-full"></div>
                              Total sales <span className="text-gray-400 font-medium ml-1">/ day</span>
                          </div>
                          <span className="text-gray-400 font-medium">For week</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-3 text-gray-400/80">
                              <div className="w-4 h-1.5 bg-brand-accent/30 rounded-full"></div>
                              Average sales
                          </div>
                          <span className="text-gray-400 font-medium">For today</span>
                      </div>
                  </div>
              </div>
              <button className="w-full py-4 border-t border-gray-50 text-xs font-bold text-gray-400/80 hover:text-gray-900 flex justify-center items-center gap-2 rounded-b-3xl hover:bg-gray-50 transition-all outline-none opacity-80 hover:opacity-100">
                  See details <ArrowRight strokeWidth={2} className="w-4 h-4" />
              </button>
          </div>


          {/* Row 3: Bottom Metrics */}
          <div className="col-span-1 lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-8 h-full flex flex-col">
              <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                      <div className="p-3.5 border border-brand-accent/10 bg-brand-accent/5 rounded-2xl text-gray-900 shadow-sm">
                          <Users strokeWidth={2} className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-400">Total visits</h3>
                              <Info strokeWidth={1.5} className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-[32px] font-bold text-black">288,822</span>
                              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                  <ArrowUp strokeWidth={2} className="w-2.5 h-2.5" /> 4%
                              </span>
                          </div>
                      </div>
                  </div>
                  <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors shadow-sm outline-none">
                      <MoreHorizontal strokeWidth={2} className="w-5 h-5" />
                  </button>
              </div>

              <div className="flex gap-6 mt-6 grow">
                  <div className="flex flex-col gap-5 text-[10px] font-bold text-gray-400 uppercase justify-around py-2">
                      <span>MON</span><span>TUE</span><span>WED</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                      <div className="flex gap-2 items-center relative">
                          <div className="h-8 w-full bg-brand-accent/10 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent rounded-lg relative flex items-center justify-center cursor-pointer shadow-sm shadow-brand-accent/20 transition-transform hover:scale-105 active:scale-95 group">
                              <div className="absolute bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full -top-10 whitespace-nowrap flex items-center gap-2 z-20 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none border border-white/10">
                                  <Users strokeWidth={2.5} className="w-3 h-3 text-brand-accent" /> 3,880 (8AM)
                              </div>
                          </div>
                          <div className="h-8 w-full bg-brand-accent/10 rounded-lg"></div>
                          <div className="h-8 w-full bg-gray-50 rounded-lg"></div>
                          <Plus strokeWidth={2.5} className="w-4 h-4 text-gray-300 mx-2 rotate-45" />
                      </div>
                      <div className="flex gap-2 items-center opacity-80">
                          <div className="h-8 w-full bg-brand-accent/5 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/10 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/40 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/60 rounded-lg"></div>
                          <div className="w-4 h-px bg-gray-200 mx-2"></div>
                      </div>
                      <div className="flex gap-2 items-center opacity-60">
                          <div className="h-8 w-full bg-gray-50 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/5 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/80 rounded-lg"></div>
                          <div className="h-8 w-full bg-brand-accent/40 rounded-lg"></div>
                          <div className="w-4 h-px bg-transparent mx-2"></div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="col-span-1 lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-8 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-400">Top Products</h3>
                      <Info strokeWidth={1.5} className="w-4.5 h-4.5 text-gray-300" />
                  </div>
                  <a href="#" className="text-xs font-bold text-gray-400/80 hover:text-gray-900 flex items-center gap-2 group transition-colors opacity-80 hover:opacity-100">
                      See details <ArrowRight strokeWidth={2.5} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
              </div>

              <div className="flex flex-col xl:flex-row gap-10 h-full">
                  <div className="w-full xl:w-72 border border-gray-100 rounded-3xl p-6 flex flex-col justify-between bg-gray-50/30 transition-shadow hover:shadow-md">
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm">
                                <Trello strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <span className="text-base font-bold text-gray-900">Blid Shorts</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[32px] font-normal text-gray-400">Br.</span>
                            <span className="text-[32px] font-bold text-black">4,730.33</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden shadow-inner">
                              <div className="bg-brand-accent h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--brand-accent),0.5)]" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-micro font-bold text-gray-400 uppercase mt-6">
                        <span className="text-green-500 mr-1.5 font-extrabold uppercase">12%</span> Targets achieved
                      </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="border-b border-gray-100">
                                  <th className="pb-5 text-[10px] font-bold text-gray-400 w-1/3">Product</th>
                                  <th className="pb-5 text-[10px] font-bold text-gray-400">Sales</th>
                                  <th className="pb-5 text-[10px] font-bold text-gray-400">Revenue</th>
                                  <th className="pb-5 text-[10px] font-bold text-gray-400">Stock</th>
                                  <th className="pb-5 text-[10px] font-bold text-gray-400 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {topItems.map((item, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                                    <td className="py-6 font-bold text-gray-900 text-body">{item.name}</td>
                                    <td className="py-6 text-gray-600 font-medium">{item.sales} <span className="text-gray-400 text-micro font-bold uppercase ml-0.5">pcs</span></td>
                                    <td className="py-6 text-gray-900 font-bold">{item.rev}</td>
                                    <td className="py-6 text-gray-500 font-bold">{item.stock}</td>
                                    <td className="py-6 text-right">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-micro font-bold uppercase ${item.statusColor}`}>
                                          {item.status}
                                        </span>
                                    </td>
                                </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}
