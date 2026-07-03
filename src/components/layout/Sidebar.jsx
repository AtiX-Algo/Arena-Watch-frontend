// import { useEffect, useState } from 'react';
// import { useStore } from '../../lib/store';
// import { Radio, PlayCircle, Loader2 } from 'lucide-react';

// export default function Sidebar() {
//   const { isSidebarOpen, activeChannel, setActiveChannel, setChannels, channels } = useStore();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchChannels = async () => {
//       try {
//         const response = await fetch('https://arena-watch-backend-1.onrender.com/api/channels');
//         const data = await response.json();
//         setChannels(data);
//       } catch (error) {
//         console.error("Error fetching channels:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchChannels();
//   }, [setChannels]);

//   if (!isSidebarOpen) return null;

//   return (
//     <div className="w-64 bg-base-200 border-r border-gray-800 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
//       <div className="p-4 border-b border-gray-800 sticky top-0 bg-base-200 z-10">
//         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
//           <Radio className="w-4 h-4 text-red-500 animate-pulse" />
//           Live Channels
//         </h2>
//       </div>
      
//       <div className="flex-1 p-2 space-y-1">
//         {loading ? (
//           <div className="flex items-center justify-center p-8 text-accent-green">
//             <Loader2 className="w-6 h-6 animate-spin" />
//           </div>
//         ) : channels.length === 0 ? (
//           <div className="p-4 text-center text-gray-500 text-sm">
//             No channels found. Please seed the DB.
//           </div>
//         ) : (
//           channels.map(channel => (
//             <button
//               key={channel.id}
//               onClick={() => setActiveChannel(channel)}
//               className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
//                 activeChannel?.id === channel.id 
//                   ? 'bg-accent-green/10 text-accent-green border border-accent-green/30 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]' 
//                   : 'hover:bg-base-300 text-gray-400 hover:text-white border border-transparent'
//               }`}
//             >
//               <PlayCircle className={`w-5 h-5 shrink-0 ${activeChannel?.id === channel.id ? 'text-accent-green fill-accent-green/20' : 'text-gray-500'}`} />
//               <div className="text-left flex-1 truncate">
//                 <div className="font-medium text-sm truncate">{channel.name}</div>
//               </div>
//             </button>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }