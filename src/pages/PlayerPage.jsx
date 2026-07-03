import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import dashjs from 'dashjs';
import ReactPlayer from 'react-player';
import { useStore } from '../lib/store';
import { AlertCircle, Server, Activity, Radio, PlayCircle, Loader2, Signal } from 'lucide-react';

// Dynamic Environment Switcher: Uses localhost when developing, Render when deployed
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);
const API_BASE = isLocalhost ? 'http://localhost:5000' : 'https://arena-watch-backend-1.onrender.com';

export default function PlayerPage() {
  const { channels, setChannels, activeChannel, setActiveChannel } = useStore();
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [serverIndex, setServerIndex] = useState(0);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);

  // 1. FETCH CHANNELS ON LOAD
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/channels`);
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : [];
        setChannels(safeData);

        if (safeData.length > 0 && !activeChannel) {
          setActiveChannel(safeData[0]);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
        setChannels([]);
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, [setChannels, activeChannel, setActiveChannel]);

  // 2. RESET SERVER INDEX ON CHANNEL SWITCH
  useEffect(() => {
    setServerIndex(0);
    setError(null);
  }, [activeChannel]);

  // 3. VIDEO ENGINE LOGIC VIA PRIVATE SECURE PROXY
  useEffect(() => {
    if (!activeChannel) return;

    const currentServer = activeChannel.servers[serverIndex];
    if (!currentServer) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    const video = videoRef.current;

    // Secure Pipeline Router using the dynamic API base
    const proxiedStreamUrl = `${API_BASE}/api/proxy/stream.m3u8?url=${encodeURIComponent(currentServer.url)}`;

    // --- MPEG-DASH ENGINE ---
    if (activeChannel.type === 'dash') {
      if (!video) return;
      try {
        const player = dashjs.MediaPlayer().create();
        dashRef.current = player;

        player.initialize(video, proxiedStreamUrl, true);
        player.updateSettings({
          streaming: { lowLatencyEnabled: true, retryAttempts: { manifest: 3, mediaSegment: 3 } }
        });

        player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
          console.error("DASH.js proxy matrix drop:", e);
          handleAutoFailover();
        });
      } catch (err) {
        handleAutoFailover();
      }
    }

    // --- HLS PLAYBACK ENGINE ---
    else if (activeChannel.type === 'hls' && Hls.isSupported()) {
      if (!video) return;

      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;

      hls.loadSource(proxiedStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Autoplay matrix engaged manually:", e));
        setError(null);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.destroy();
              handleAutoFailover();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              handleAutoFailover();
              break;
          }
        }
      });
    }

    // --- Native Apple Safari HLS Support ---
    else if (activeChannel.type === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedStreamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log("Autoplay fallback:", e));
      });
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (dashRef.current) dashRef.current.reset();
    };
  }, [activeChannel, serverIndex]);

  const handleAutoFailover = () => {
    if (activeChannel && serverIndex < activeChannel.servers.length - 1) {
      setError(`Node connection drop. Auto-routing to backup server...`);
      setTimeout(() => {
        setServerIndex(prev => prev + 1);
        setError(null);
      }, 2000);
    } else {
      setError("All redundant stream channels are currently unresponsive.");
    }
  };

  const activeServer = activeChannel?.servers[serverIndex];

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-[#070708] overflow-hidden antialiased">
      {/* SIDEBAR */}
      <div className="w-64 sm:w-72 bg-[#0d0d0f] border-r border-gray-900 flex flex-col shrink-0 h-full">
        <div className="p-4 border-b border-gray-900 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            Live Command Feeds
          </h2>
        </div>

        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {loadingChannels ? (
            <div className="flex flex-col items-center justify-center py-20 text-accent-green gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-accent-green" />
              <span className="text-xs text-gray-500 tracking-wide">Syncing Nodes...</span>
            </div>
          ) : !Array.isArray(channels) || channels.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 bg-[#121214] rounded-xl border border-gray-900 font-medium">
              Servers are currently offline or syncing. Please try again in a moment.
            </div>
          ) : (
            channels.map(channel => {
              const isSelected = activeChannel?.id === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left relative border ${isSelected
                      ? 'bg-accent-green/5 text-accent-green border-accent-green/30 shadow-[inset_0_0_12px_rgba(34,197,94,0.06)] font-bold'
                      : 'bg-transparent border-transparent text-gray-400 hover:bg-[#121215] hover:text-gray-200'
                    }`}
                >
                  {isSelected && <span className="absolute left-0 top-3 bottom-3 w-1 bg-accent-green rounded-r" />}
                  <PlayCircle className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isSelected ? 'text-accent-green fill-accent-green/10' : 'text-gray-600 group-hover:text-gray-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate leading-snug">{channel.name}</div>
                  </div>
                  {isSelected && <Signal className="w-3.5 h-3.5 text-accent-green animate-pulse shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MONITOR CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070708] h-full custom-scrollbar">
        {!activeChannel ? (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#0d0d0f]/50 rounded-2xl border border-gray-900 shadow-2xl relative overflow-hidden">
            <Activity className="w-12 h-12 text-gray-800 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-gray-400 tracking-wide">No Active Matrix Selected</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto transition-all duration-300">
            {/* Live Feed Canvas */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-900 shadow-[0_12px_40px_rgba(0,0,0,0.5)] group">
              {error && (
                <div className="absolute top-4 left-4 right-4 z-20 bg-red-950/80 backdrop-blur-md border border-red-500/30 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <p className="text-xs font-semibold tracking-wide text-red-200">{error}</p>
                </div>
              )}

              {activeChannel.type === 'iframe' ? (
                <iframe
                  src={activeServer?.url}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              ) : activeChannel.type === 'youtube' ? (
                <div className="w-full h-full pointer-events-auto">
                  <ReactPlayer
                    url={activeServer?.url}
                    playing
                    controls
                    width="100%"
                    height="100%"
                    config={{ youtube: { playerVars: { showinfo: 0, autoplay: 1, rel: 0 } } }}
                  />
                </div>
              ) : (
                <video
                  key={`${activeChannel.id}-${serverIndex}`}
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>

            {/* METADATA SYSTEM */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-[#0d0d0f] rounded-2xl border border-gray-900 gap-5 shadow-xl">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#121215] border border-gray-800 flex items-center justify-center shrink-0 relative">
                  {activeChannel.logo ? (
                    <img src={activeChannel.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Activity className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-green border-2 border-[#0d0d0f] rounded-full" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white leading-tight tracking-tight truncate">{activeChannel.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] font-bold mt-1.5">
                    <span className="text-accent-green uppercase tracking-widest bg-accent-green/5 px-2 py-0.5 rounded border border-accent-green/10">{activeChannel.category}</span>
                    <span className="text-gray-700">•</span>
                    <span className="bg-[#141417] px-2 py-0.5 rounded border border-gray-800 text-gray-400 font-mono">{activeServer?.quality || 'RAW-AUTO'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block md:text-right font-mono">Routing Matrix Nodes</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeChannel.servers.map((server, idx) => {
                    const isActive = idx === serverIndex;
                    return (
                      <button
                        key={server.serverId || idx}
                        onClick={() => setServerIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center transition-all border ${isActive ? 'bg-accent-green border-accent-green text-black shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-[#121215] border-gray-800 text-gray-400 hover:bg-[#16161a]'
                          }`}
                      >
                        <Server className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-black' : 'text-gray-500'}`} />
                        <span className="font-mono tracking-wide">{server.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}