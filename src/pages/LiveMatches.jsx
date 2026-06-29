// import { useStore } from '../lib/store';
// import MatchCard from '../components/ui/MatchCard';
// import { Radio } from 'lucide-react';

// export default function LiveMatches() {
//   // Grab the instant cached data from global store!
//   const matches = useStore((state) => state.matches) || [];

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <div className="flex justify-between items-end border-b border-gray-800 pb-4">
//         <div>
//           <h1 className="text-3xl font-bold text-white">Live Fixtures</h1>
//           <p className="text-gray-400 mt-1">Real-time tracking powered by ESPN API</p>
//         </div>
        
//         {/* Global Live Status Indicator */}
//         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-accent-green/10 text-accent-green border border-accent-green/30">
//           <Radio className="w-3 h-3 animate-pulse" />
//           Live
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//         {matches.map(match => (
//           <MatchCard key={match.id} match={match} />
//         ))}
//       </div>
      
//       {matches.length === 0 && (
//         <div className="text-center p-12 border border-dashed border-gray-800 rounded-xl">
//           <p className="text-gray-500">No matches currently scheduled or active.</p>
//         </div>
//       )}
//     </div>
//   );
// }