import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Command } from 'lucide-react';
import { sound } from '../services/sound';

interface DynamicIslandProps {
  onOpenCmd: () => void;
  onOpenRandom: () => void;
  postCount: number;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  onOpenCmd,
  onOpenRandom,
  postCount,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [soundOn, setSoundOn] = useState(sound.getEnabled());

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
  };

  return (
    <div className="dynamic-telemetry-island">
      <div className="island-inner">
        {/* Solo status */}
        <div className="island-segment status-seg" onClick={onOpenCmd} title="Réseau 100% privé et local">
          <span className="island-live-dot" />
          <span className="island-text mono-tag">SOLO CORE</span>
          <span className="island-sep">/</span>
          <span className="island-subtext mono-tag">{postCount} SOUVENIRS</span>
        </div>

        {/* Live clock */}
        <div className="island-segment clock-seg">
          <span className="island-time mono-tag">{timeStr}</span>
        </div>

        {/* Quick action shortcuts */}
        <div className="island-segment actions-seg">
          <button 
            className="island-action-btn"
            onClick={() => {
              sound.playTap();
              onOpenRandom();
            }}
            title="Flashback souvenir aléatoire"
          >
            <Sparkles size={13} />
          </button>

          <button 
            className="island-action-btn"
            onClick={handleToggleSound}
            title={soundOn ? 'Effets sonores actifs' : 'Effets sonores désactivés'}
          >
            {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <button 
            className="island-cmd-badge"
            onClick={() => {
              sound.playPop();
              onOpenCmd();
            }}
            title="Ouvrir la palette de commandes"
          >
            <Command size={11} />
            <span>K</span>
          </button>
        </div>
      </div>
    </div>
  );
};
