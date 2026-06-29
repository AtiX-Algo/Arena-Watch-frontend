import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import dashjs from 'dashjs'; // Imported for the .mpd streams
import ReactPlayer from 'react-player';
import { useStore } from '../../lib/store';
import { AlertCircle, Server, Activity } from 'lucide-react';

export default function VideoPlayer() {
  const activeChannel = useStore((state) => state.activeChannel);
  const [serverIndex, setServerIndex] = useState(0);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null); // Ref to track dash.js instances

  // Reset server index and errors when user switches channels
  useEffect(() => {
    setServerIndex(0);
    setError(null);
  }, [activeChannel]);

  useEffect(() => {
    if (!activeChannel) return;

    const currentServer = activeChannel.servers[serverIndex];
    if (!currentServer) return;

    // Clean up previous streaming engine attachments
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    const video = videoRef.current;

    // --- MPEG-DASH (.mpd) PLAYBACK ENGINE ---
    if (activeChannel.type === 'dash') {
      if (!video) return;

      try {
        const player = dashjs.MediaPlayer().create();
        dashRef.current = player;
        
        // Low Latency / Fast-load tuning parameters
        player.initialize(video, currentServer.url, true);
        player.updateSettings({
          streaming: {
            lowLatencyEnabled: true,
            retryAttempts: {
              manifest: 3,
              mediaSegment: 3
            }
          }
        });

        // Failover handling for DASH
        player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
          console.error("DASH.js error encountered:", e);
          if (e.error && (e.error.code === 403 || e.error.code === 404)) {
            handleAutoFailover();
          }
        });

      } catch (err) {
        console.error("Failed to initialize DASH player", err);
        handleAutoFailover();
      }
    }
    
    // --- HLS (.m3u8) PLAYBACK ENGINE ---
    else if (activeChannel.type === 'hls' && Hls.isSupported()) {
      if (!video) return;

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
      });

      hlsRef.current = hls;
      hls.loadSource(currentServer.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay blocked by browser:", e));
        setError(null);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response && (data.response.code === 403 || data.response.code === 404)) {
                console.log(`Fatal ${data.response.code} error encountered. Moving to backup...`);
                hls.destroy();
                handleAutoFailover();
              } else {
                console.log('Network error, retrying loop...');
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying player...');
              hls.destroy();
              handleAutoFailover();
              break;
          }
        }
      });
    }
    
    // Native Apple HLS Support (Safari)
    else if (activeChannel.type === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentServer.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log("Autoplay blocked:", e));
      });
    }

    // Component unmount cleanup
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (dashRef.current) dashRef.current.reset();
    };
  }, [activeChannel, serverIndex]);

  const handleAutoFailover = () => {
    if (activeChannel && serverIndex < activeChannel.servers.length - 1) {
      setError(`Server ${serverIndex + 1} failed. Auto-switching to backup...`);
      setTimeout(() => {
        setServerIndex(prev => prev + 1);
        setError(null);
      }, 2000);
    } else {
      setError("All available servers failed for this channel.");
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-video bg-black rounded-xl border border-gray-800 shadow-2xl">
        <Activity className="w-12 h-12 text-gray-700 mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold text-gray-500">No Stream Selected</h3>
        <p className="text-gray-600 text-sm">Select a channel from the sidebar</p>
      </div>
    );
  }

  const activeServer = activeChannel.servers[serverIndex];

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto animate-fade-in">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 shadow-[0_0_30px_rgba(34,197,94,0.05)]">

        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-red-950/90 border border-red-500 text-white px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {activeChannel.type === 'youtube' ? (
          <ReactPlayer
            url={activeServer?.url}
            playing
            controls
            width="100%"
            height="100%"
            config={{ youtube: { playerVars: { showinfo: 1, autoplay: 1 } } }}
          />
        ) : (
          <video
            key={`${activeChannel.id}-${serverIndex}`} // Combined key forces full element re-render between stream variations
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-base-200 rounded-xl border border-gray-800 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-base-300 border border-gray-700 overflow-hidden flex items-center justify-center">
            {activeChannel.logo ? (
              <img src={activeChannel.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Activity className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{activeChannel.name}</h2>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1">
              <span className="text-accent-green uppercase tracking-wider">{activeChannel.category}</span>
              <span>•</span>
              <span className="bg-gray-800 px-2 py-0.5 rounded-md text-gray-300">{activeServer?.quality || 'Auto'}</span>
              <span>•</span>
              <span className="text-gray-500 uppercase">{activeChannel.type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeChannel.servers.map((server, idx) => (
            <button
              key={server.serverId}
              onClick={() => setServerIndex(idx)}
              className={`btn btn-sm ${idx === serverIndex
                ? 'bg-accent-green text-black hover:bg-green-600 border-none'
                : 'btn-outline border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                }`}
            >
              <Server className="w-4 h-4 mr-1" />
              {server.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}