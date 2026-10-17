import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import SetupScreen, { SetupResult } from './components/SetupScreen';
import BattleScreen from './components/BattleScreen';

type Screen = 'home' | 'setup' | 'battle';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [setup, setSetup] = useState<SetupResult | null>(null);
  const [battleKey, setBattleKey] = useState(0);

  return (
    <div className="min-h-[100dvh]">
      {screen === 'home' && (
        <HomeScreen onStart={() => setScreen('setup')} />
      )}
      {screen === 'setup' && (
        <SetupScreen
          onBack={() => setScreen('home')}
          onStart={(r) => {
            setSetup(r);
            setBattleKey((k) => k + 1);
            setScreen('battle');
          }}
        />
      )}
      {screen === 'battle' && setup && (
        <BattleScreen
          key={battleKey}
          mode={setup.mode}
          level={setup.level}
          players={setup.players}
          battleKey={battleKey}
          onExit={() => setScreen('home')}
          onRematch={() => setBattleKey((k) => k + 1)}
          onSetup={() => setScreen('setup')}
        />
      )}
    </div>
  );
}
