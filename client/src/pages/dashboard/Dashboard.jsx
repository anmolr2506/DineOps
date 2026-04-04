import React from 'react';

export default function Dashboard() {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const stats = [
    { label: 'TOTAL ORDERS', value: '142' },
    { label: 'PENDING APPROVAL', value: '8', alert: true },
    { label: 'PAID ORDERS', value: '128' },
    { label: 'TOTAL REVENUE', value: '$4,285.50', highlight: true },
    { label: 'ACTIVE TABLES', value: '12/24' },
    { label: 'IN KITCHEN', value: '15' }
  ];

  const recentOrders = [
    { orderNo: '#ORD-4582', table: 'Table 12', status: 'IN KITCHEN', amount: '$124.50' },
    { orderNo: '#ORD-4581', table: 'Table 03', status: 'PENDING', amount: '$45.00' },
  ];

  const operations = [
    { name: 'NEW POS ORDER', primary: true, icon: '⊕' },
    { name: 'MANAGE TABLES' },
    { name: 'GENERATE QR' },
    { name: 'VIEW KITCHEN' },
    { name: 'VIEW REPORTS' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Page Title & Session Info */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-gray-400 italic">Real-time cinematic analytics hub</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="inline-flex items-center gap-2 bg-[#dcb973]/10 text-[#dcb973] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-2 border border-[#dcb973]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dcb973] animate-pulse"></span>
            SESSION ACTIVE #042
          </div>
          <p className="text-xs text-gray-500">{currentDate}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${stat.alert ? 'border-red-900/50 bg-red-950/10' : 'border-white/5 bg-[#141418]'} flex flex-col justify-between relative overflow-hidden group`}>
            {/* Subtle gradient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3 header-font relative z-10 flex items-center justify-between">
              {stat.label}
              {stat.alert && <span className="text-red-500 text-sm">△</span>}
            </p>
            <p className={`text-2xl font-bold relative z-10 ${stat.highlight ? 'text-[#dcb973]' : stat.alert ? 'text-red-400' : 'text-white'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Operations Operations Row */}
      <div className="flex flex-wrap gap-3">
        {operations.map((op, i) => (
          <button 
            key={i}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 border flex justify-center items-center gap-2 ${
              op.primary 
                ? 'bg-[#dcb973] text-black border-[#dcb973] hover:bg-[#ebd097] hover:shadow-[0_0_15px_rgba(220,185,115,0.3)]' 
                : 'bg-[#1A1A20] text-gray-300 border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            {op.icon && <span className="text-lg leading-none">{op.icon}</span>}
            {op.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141418] rounded-3xl border border-white/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Recent Orders</h3>
              <button className="text-xs text-[#dcb973] hover:text-white transition-colors tracking-wide">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest">
                    <th className="pb-3 font-medium px-2">Order No</th>
                    <th className="pb-3 font-medium px-2">Table</th>
                    <th className="pb-3 font-medium px-2 text-center">Status</th>
                    <th className="pb-3 font-medium px-2 text-right">Amount</th>
                    <th className="pb-3 font-medium px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentOrders.map((order, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-2 font-mono text-gray-300">{order.orderNo}</td>
                      <td className="py-4 px-2 text-gray-400">{order.table}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                          order.status === 'IN KITCHEN' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-medium text-white">{order.amount}</td>
                      <td className="py-4 px-2 text-right">
                        <button className="text-gray-500 hover:text-[#dcb973] transition-colors">
                           👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#141418] rounded-3xl border border-white/5 p-6 h-64 flex flex-col justify-end relative overflow-hidden group">
            <h3 className="text-lg font-bold text-white absolute top-6 left-6 z-10">Sales Trend</h3>
            
            {/* Extremely simple placeholder bar chart using flex */}
            <div className="flex items-end h-full gap-2 opacity-80 pt-16">
              {[30, 45, 25, 40, 80, 50, 45, 60, 45, 60, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col group/bar h-full justify-end">
                  {/* Tooltip placeholder */}
                  <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity mb-2 text-center text-[10px] font-bold text-gray-400">{h}</div>
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ${i === 4 ? 'bg-gradient-to-t from-[#8a7243] to-[#dcb973]' : 'bg-white/10 group-hover/bar:bg-white/20'}`} 
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity & Insights - 1 col */}
        <div className="space-y-6">
          <div className="bg-[#141418] rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Live Activity</h3>
            
            <div className="relative pl-4 space-y-6 before:absolute before:inset-y-2 before:left-[5px] before:w-px before:bg-white/10">
              <div className="relative">
                <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-[#dcb973] ring-4 ring-[#141418]"></div>
                <p className="text-sm font-bold text-white mb-0.5">Table 3 placed order</p>
                <p className="text-xs text-gray-500">2 mins ago • QR Mobile Order</p>
              </div>
              <div className="relative">
                <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-gray-500 ring-4 ring-[#141418]"></div>
                <p className="text-sm font-bold text-gray-200 mb-0.5">Kitchen Ready: #ORD-4570</p>
                <p className="text-xs text-gray-500">24 mins ago • Runner Alerted</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#141418] rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-bold text-[#dcb973] mb-6 flex items-center gap-2">
               Intelligence Insights
            </h3>
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6 text-sm italic text-gray-300">
              "Promote Desserts tonight to increase average ticket value by 12%."
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                  <span>Main Course</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                  <span>Beverages</span>
                  <span className="text-white">30%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-[#dcb973] rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
