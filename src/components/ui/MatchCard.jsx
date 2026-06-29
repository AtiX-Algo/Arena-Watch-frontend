import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MatchCard({ match }) {
  const homeTeam = match.competitors.find(c => c.homeAway === 'home') || match.competitors[0];
  const awayTeam = match.competitors.find(c => c.homeAway === 'away') || match.competitors[1];
  
  const isLive = match.status?.state === 'in';
  const isFinished = match.status?.state === 'post';

  return (
    <div className="bg-base-200 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-colors duration-200 shadow-lg">
      <div className="p-3 bg-base-300 border-b border-gray-800 flex justify-between items-center text-xs font-semibold text-gray-400">
        <span className="uppercase tracking-wider">{match.groupNote || 'FIFA World Cup 2026'}</span>
        {isLive ? (
          <span className="flex items-center gap-1 text-red-500 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            LIVE {match.status?.displayClock}
          </span>
        ) : isFinished ? (
          <span className="text-gray-500">FT</span>
        ) : (
          <span className="flex items-center gap-1 text-accent-green">
            <Clock className="w-3 h-3" />
            {format(parseISO(match.date), 'MMM d, h:mm a')}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Home Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={homeTeam.logo} alt={homeTeam.displayName} className="w-8 h-8 object-contain" />
            <span className={`font-bold ${homeTeam.winner ? 'text-white' : 'text-gray-300'}`}>
              {homeTeam.displayName}
            </span>
          </div>
          <span className={`text-xl font-bold ${homeTeam.winner ? 'text-accent-green' : 'text-white'}`}>
            {isLive || isFinished ? homeTeam.score : '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={awayTeam.logo} alt={awayTeam.displayName} className="w-8 h-8 object-contain" />
            <span className={`font-bold ${awayTeam.winner ? 'text-white' : 'text-gray-300'}`}>
              {awayTeam.displayName}
            </span>
          </div>
          <span className={`text-xl font-bold ${awayTeam.winner ? 'text-accent-green' : 'text-white'}`}>
            {isLive || isFinished ? awayTeam.score : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}