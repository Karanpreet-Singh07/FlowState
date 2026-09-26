import { useState } from 'react';
import VisionEngine from './components/VisionEngine';
import CoachModal from './components/CoachModal';

function App() {
  const [postureData, setPostureData] = useState({ postureScore: 100, isSlouching: false });

  return (
    <div style={{ background: '#111', height: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Engine + Coach Test</h1>
      <div style={{ width: '640px', height: '480px', border: '2px solid #333', position: 'relative' }}>
        <VisionEngine onUpdate={(data) => setPostureData(data)} />
      </div>
      
      <CoachModal 
        isSlouching={postureData.isSlouching} 
        postureScore={postureData.postureScore} 
      />
    </div>
  );
}

export default App;