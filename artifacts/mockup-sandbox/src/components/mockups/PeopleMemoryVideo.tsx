import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants & Config ---
const SCENE_DURATIONS = [
  4000, // 0: Networking crowd
  6000, // 1: Phone opening, names list
  8000, // 2: Sarah's profile
  8000, // 3: Office greeting
  8000, // 4: Split cuts (UI montage)
  8000, // 5: Outro
];

const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

// --- Assets ---
const ASSETS = {
  crowd: '/src/assets/images/networking-crowd.jpg',
  office: '/src/assets/images/office-entrance.jpg',
  greeting: '/src/assets/images/greeting.jpg',
  nodes: '/src/assets/images/network-nodes.png',
  phone: '/src/assets/images/phone-mockup.png',
  sarah: '/src/assets/images/sarah.png',
};

// --- Easing ---
const EASING = {
  smooth: [0.25, 1, 0.5, 1],
  snappy: [0.16, 1, 0.3, 1],
  slow: [0.4, 0, 0.2, 1],
};

// --- Scene Components ---

function Scene0() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.img
        src={ASSETS.crowd}
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        initial={{ scale: 1.1, filter: 'blur(10px)' }}
        animate={{ scale: 1, filter: 'blur(4px)' }}
        transition={{ duration: 4, ease: 'linear' }}
      />
      <div className="relative z-10 text-center max-w-3xl px-8">
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl text-white font-space-grotesk tracking-tight leading-tight"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.5, ease: EASING.smooth }}
        >
          You met 12 people last Tuesday.
        </motion.h1>
      </div>
    </motion.div>
  );
}

function Scene1() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1500); // UI appears
    const t2 = setTimeout(() => setStage(2), 2500); // List appears
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const names = ['Alex Rivera', 'Jordan Smith', 'Sarah Chen', 'Marcus Johnson', 'Elena Rostova'];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1 }}
    >
      {/* Background Nodes */}
      <motion.img
        src={ASSETS.nodes}
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
        initial={{ scale: 1.2, rotate: 2 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 6, ease: 'linear' }}
      />

      {/* Phone Frame Zoomed In */}
      <motion.div
        className="relative w-[400px] h-[800px] bg-black rounded-[48px] border-[8px] border-gray-800 shadow-2xl overflow-hidden"
        initial={{ y: '50vh', scale: 1.5, rotateX: 20 }}
        animate={{ y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 1.5, ease: EASING.smooth }}
        style={{ perspective: 1000 }}
      >
        {/* Screen Content */}
        <div className="absolute inset-0 flex flex-col p-8 bg-[#0a0a0a]">
          <motion.div
            className="flex items-center space-x-3 mb-10 mt-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -20 }}
            transition={{ duration: 0.8, ease: EASING.snappy }}
          >
            <div className="w-8 h-8 rounded-full bg-[#007ACC] flex items-center justify-center relative">
              <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-2" />
              <div className="w-2 h-2 bg-white rounded-full absolute bottom-2 right-2" />
              <div className="w-4 h-0.5 bg-white absolute rotate-45" />
            </div>
            <span className="text-xl text-white font-space-grotesk tracking-widest font-bold">PEOPLE</span>
          </motion.div>

          <div className="flex-1 flex flex-col space-y-4">
            {names.map((name, i) => (
              <motion.div
                key={name}
                className="flex items-center p-4 bg-[#1A1A1A] rounded-2xl border border-gray-800"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: stage >= 2 ? 1 : 0, x: stage >= 2 ? 0 : -30 }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: EASING.snappy }}
              >
                <div className={`w-12 h-12 rounded-full mr-4 bg-gradient-to-br ${i === 2 ? 'from-[#007ACC] to-blue-900 p-[2px]' : 'from-gray-700 to-gray-900'}`}>
                  {i === 2 ? (
                     <img src={ASSETS.sarah} className="w-full h-full rounded-full object-cover" />
                  ) : (
                     <div className="w-full h-full rounded-full bg-gray-800" />
                  )}
                </div>
                <div>
                  <div className="text-white font-inter font-medium text-lg">{name}</div>
                  <div className="text-gray-500 font-inter text-sm">Met {i + 1} days ago</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Scene2() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800); // Profile enters
    const t2 = setTimeout(() => setStage(2), 2000); // Details stagger
    const t3 = setTimeout(() => setStage(3), 3500); // Zoom in
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="w-full h-full flex items-center justify-center relative"
        animate={{ scale: stage >= 3 ? 1.4 : 1 }}
        transition={{ duration: 4, ease: EASING.slow }}
      >
        <motion.div
          className="w-[800px] bg-[#0f0f0f] rounded-3xl border border-gray-800 p-12 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 40, scale: stage >= 1 ? 1 : 0.95 }}
          transition={{ duration: 0.8, ease: EASING.snappy }}
        >
           {/* Abstract bg element inside profile */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#007ACC] opacity-10 blur-[100px] rounded-full mix-blend-screen" />

           <div className="flex items-start mb-10 relative z-10">
              <motion.div
                 className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1A1A1A] shadow-lg"
                 initial={{ scale: 0, rotate: -10 }}
                 animate={{ scale: stage >= 1 ? 1 : 0, rotate: stage >= 1 ? 0 : -10 }}
                 transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <img src={ASSETS.sarah} className="w-full h-full object-cover" />
              </motion.div>
              <div className="ml-8 mt-4">
                <motion.h2
                  className="text-4xl text-white font-space-grotesk font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: stage >= 1 ? 1 : 0, x: stage >= 1 ? 0 : -20 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Sarah Chen
                </motion.h2>
                <motion.div
                  className="flex gap-3 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: stage >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="px-4 py-1.5 bg-gray-800 text-gray-300 rounded-full font-inter text-sm">Product Manager</span>
                  <span className="px-4 py-1.5 bg-[#007ACC]/20 text-[#007ACC] rounded-full font-inter text-sm border border-[#007ACC]/30">Work</span>
                </motion.div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8 relative z-10">
              <motion.div
                className="bg-[#151515] p-6 rounded-2xl border border-gray-800/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-gray-500 font-inter text-sm uppercase tracking-wider mb-2">Trust Level</h3>
                <div className="flex items-center">
                  <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      initial={{ width: '0%' }}
                      animate={{ width: stage >= 2 ? '85%' : '0%' }}
                      transition={{ duration: 1.5, delay: 0.5, ease: EASING.smooth }}
                    />
                  </div>
                  <span className="ml-4 text-green-400 font-space-grotesk font-bold">85%</span>
                </div>
              </motion.div>

              <motion.div
                className="bg-[#151515] p-6 rounded-2xl border border-gray-800/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-gray-500 font-inter text-sm uppercase tracking-wider mb-4">Notes</h3>
                <ul className="space-y-3 text-gray-300 font-inter leading-relaxed">
                  <motion.li initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ delay: 0.8 }}>• Loves weekend hiking in Marin.</motion.li>
                  <motion.li initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ delay: 1.0 }}>• Hates small talk.</motion.li>
                  <motion.li initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ delay: 1.2 }}>• Met at TechConf 2025.</motion.li>
                </ul>
              </motion.div>
           </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Scene3() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2000); // Transition to greeting
    const t2 = setTimeout(() => setStage(2), 3500); // Subtitle appears
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      <motion.img
        src={ASSETS.office}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: stage >= 1 ? 0 : 1, scale: 1.05 }}
        transition={{ duration: 2 }}
      />
      <motion.img
        src={ASSETS.greeting}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, scale: 1 }}
        transition={{ duration: 2, ease: EASING.smooth }}
      />
      
      {/* Subtitle Box */}
      <motion.div
        className="absolute bottom-20 left-0 right-0 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
        transition={{ duration: 0.8, ease: EASING.snappy }}
      >
        <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
           <p className="text-2xl md:text-3xl text-white font-space-grotesk tracking-wide">
             "Sarah — still doing those weekend hikes?"
           </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Scene4() {
  const [cut, setCut] = useState(0);

  useEffect(() => {
    const times = [
      setTimeout(() => setCut(1), 2000),
      setTimeout(() => setCut(2), 4000),
      setTimeout(() => setCut(3), 6000),
    ];
    return () => times.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 bg-[#0a0a0a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.5 }}
    >
       {/* Background Noise/Grid */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black opacity-50" />
       
       <AnimatePresence mode="wait">
         {cut === 0 && (
           <motion.div
             key="cut0"
             className="absolute inset-0 flex items-center justify-center"
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 1.2, opacity: 0 }}
             transition={{ duration: 0.5, ease: EASING.snappy }}
           >
             <div className="text-center">
               <div className="w-24 h-24 mx-auto bg-[#007ACC] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,122,204,0.6)]">
                 <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                 </svg>
               </div>
               <h2 className="text-3xl font-space-grotesk text-white">Add New Person</h2>
             </div>
           </motion.div>
         )}

         {cut === 1 && (
           <motion.div
             key="cut1"
             className="absolute inset-0 flex items-center justify-center"
             initial={{ x: '100%', opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: '-100%', opacity: 0 }}
             transition={{ duration: 0.5, ease: EASING.snappy }}
           >
             <div className="grid grid-cols-4 gap-6 p-8 bg-[#151515] rounded-3xl border border-gray-800">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <motion.div
                   key={i}
                   className={`w-20 h-20 rounded-full ${i === 3 ? 'border-4 border-[#007ACC] scale-110' : 'bg-gray-800'} overflow-hidden relative`}
                   initial={{ scale: 0 }}
                   animate={{ scale: i === 3 ? 1.1 : 1 }}
                   transition={{ delay: i * 0.05, type: 'spring' }}
                 >
                   {i === 3 && <img src={ASSETS.sarah} className="w-full h-full object-cover" />}
                 </motion.div>
               ))}
             </div>
           </motion.div>
         )}

         {cut === 2 && (
           <motion.div
             key="cut2"
             className="absolute inset-0 flex items-center justify-center"
             initial={{ scale: 1.2, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.8, opacity: 0 }}
             transition={{ duration: 0.5, ease: EASING.snappy }}
           >
             <div className="flex flex-col space-y-6">
                <motion.div className="flex gap-4" initial={{ x: -50 }} animate={{ x: 0 }} transition={{ type: 'spring' }}>
                   <div className="px-6 py-3 bg-[#007ACC] text-white rounded-full text-xl font-inter">Investor</div>
                   <div className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full text-xl font-inter">Design</div>
                   <div className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full text-xl font-inter">SF</div>
                </motion.div>
                <motion.div className="flex gap-4" initial={{ x: 50 }} animate={{ x: 0 }} transition={{ type: 'spring', delay: 0.1 }}>
                   <div className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full text-xl font-inter">NYC</div>
                   <div className="px-6 py-3 bg-[#007ACC] text-white rounded-full text-xl font-inter">Engineer</div>
                   <div className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full text-xl font-inter">Alumni</div>
                </motion.div>
             </div>
           </motion.div>
         )}

         {cut === 3 && (
           <motion.div
             key="cut3"
             className="absolute inset-0 flex items-center justify-center"
             initial={{ opacity: 0, rotateX: 90 }}
             animate={{ opacity: 1, rotateX: 0 }}
             exit={{ opacity: 0, scale: 2 }}
             transition={{ duration: 0.6, ease: EASING.snappy }}
           >
             <div className="flex flex-col items-center">
               <h3 className="text-2xl text-gray-400 font-inter mb-8 uppercase tracking-widest">Trust Level</h3>
               <div className="w-[600px] h-6 bg-gray-800 rounded-full overflow-hidden">
                 <motion.div
                   className="h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]"
                   initial={{ width: '20%' }}
                   animate={{ width: '95%' }}
                   transition={{ duration: 1.5, ease: EASING.smooth }}
                 />
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}

function Scene5() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1500); // Nodes assemble / Logo
    const t2 = setTimeout(() => setStage(2), 3500); // Tagline
    const t3 = setTimeout(() => setStage(3), 5500); // App name
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <motion.img
        src={ASSETS.nodes}
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
        initial={{ scale: 2, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Abstract animated logo assembling */}
        <motion.div
          className="relative w-32 h-32 mb-12"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, scale: stage >= 1 ? 1 : 0 }}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }}
        >
          <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#007ACC] rounded-full shadow-[0_0_20px_#007ACC]" />
          <motion.div className="absolute bottom-0 left-0 w-6 h-6 bg-white rounded-full" />
          <motion.div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full" />
          
          {/* Connecting lines */}
          <motion.div className="absolute top-3 left-3 w-0.5 h-[100px] bg-gradient-to-b from-[#007ACC] to-white origin-top -rotate-45"
            initial={{ scaleY: 0 }} animate={{ scaleY: stage >= 1 ? 1 : 0 }} transition={{ delay: 0.5, duration: 1 }} />
          <motion.div className="absolute top-3 right-3 w-0.5 h-[100px] bg-gradient-to-b from-[#007ACC] to-white origin-top rotate-45"
            initial={{ scaleY: 0 }} animate={{ scaleY: stage >= 1 ? 1 : 0 }} transition={{ delay: 0.5, duration: 1 }} />
          <motion.div className="absolute bottom-3 left-6 w-[80px] h-0.5 bg-white origin-left"
            initial={{ scaleX: 0 }} animate={{ scaleX: stage >= 1 ? 1 : 0 }} transition={{ delay: 0.5, duration: 1 }} />
        </motion.div>

        <motion.div
          className="overflow-hidden mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h2
            className="text-3xl md:text-4xl text-gray-300 font-inter tracking-wide text-center"
            initial={{ y: 40 }}
            animate={{ y: stage >= 2 ? 0 : 40 }}
            transition={{ duration: 0.8, ease: EASING.smooth }}
          >
            People. <span className="text-white font-bold">Remember everyone that matters.</span>
          </motion.h2>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl text-white font-space-grotesk font-bold tracking-[0.2em]"
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 20, filter: stage >= 3 ? 'blur(0px)' : 'blur(10px)' }}
          transition={{ duration: 1.5, ease: EASING.smooth }}
        >
          PEOPLE MEMORY
        </motion.h1>
      </div>
    </motion.div>
  );
}

export default function PeopleMemoryVideo() {
  const [currentScene, setCurrentScene] = useState(0);

  // Preload fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let accumulatedTime = 0;
    let isCancelled = false;

    const scheduleNextScene = (sceneIndex: number) => {
      if (isCancelled) return;
      if (sceneIndex >= SCENE_DURATIONS.length) {
        // Loop back to 0
        setCurrentScene(0);
        scheduleNextScene(0);
        return;
      }

      setCurrentScene(sceneIndex);
      timeout = setTimeout(() => {
        scheduleNextScene(sceneIndex + 1);
      }, SCENE_DURATIONS[sceneIndex]);
    };

    scheduleNextScene(0);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-[#1A1A1A]">
      <style>{`
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
      
      {/* Persistent global effects or overlays could go here */}

      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene0 key="scene0" />}
        {currentScene === 1 && <Scene1 key="scene1" />}
        {currentScene === 2 && <Scene2 key="scene2" />}
        {currentScene === 3 && <Scene3 key="scene3" />}
        {currentScene === 4 && <Scene4 key="scene4" />}
        {currentScene === 5 && <Scene5 key="scene5" />}
      </AnimatePresence>
    </div>
  );
}
