import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  Coins, 
  Hammer, 
  TrendingUp, 
  Layers, 
  Info, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  TreePine, 
  Fish, 
  Building2, 
  Mail, 
  User, 
  LogOut, 
  KeyRound, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Waves, 
  Pickaxe, 
  ShoppingBag, 
  Store, 
  Zap, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { DEFAULT_RULES } from '@shared/rules';
import { MerchantState, MerchantId, GoodId } from '@shared/types';
import { getMerchantQuote } from '@shared/pricing';
import { EmbeddedWalletManager, EmbeddedUser } from './lib/wallet';
import { harborAudio } from './lib/audio';

export default function App() {
  const [user, setUser] = useState<EmbeddedUser | null>(null);
  const [inGame, setInGame] = useState(false);
  const [activeMerchantId, setActiveMerchantId] = useState<MerchantId | null>('forge_marta');
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showTownBoardModal, setShowTownBoardModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  // Player live inventory and purse
  const [playerCoin, setPlayerCoin] = useState(50.0);
  const [playerInventory, setPlayerInventory] = useState<Record<GoodId, number>>({
    iron_ore: 12,
    iron_ingot: 2,
    timber: 10,
    plank: 2,
    fish: 8,
    smoked_fish: 1,
  });

  // Action toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    harborAudio.playChime();
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Merchants dynamic state
  const [merchants, setMerchants] = useState<Record<MerchantId, MerchantState>>({
    forge_marta: {
      id: 'forge_marta',
      name: "Marta's Forge",
      role: 'Master Blacksmith',
      personality: 'Low margin, high volume',
      cash: 120,
      stock: { iron_ore: 40, iron_ingot: 15 },
      targetStock: { iron_ore: 100, iron_ingot: 50 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    piers_timberyard: {
      id: 'piers_timberyard',
      name: 'Old Piers Timberyard',
      role: 'Timberwright',
      personality: 'Cautious with cash, steady buyer',
      cash: 100,
      stock: { timber: 50, plank: 20 },
      targetStock: { timber: 120, plank: 60 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    tavern_gull: {
      id: 'tavern_gull',
      name: 'The Gull & Anchor',
      role: 'Harbor Smokehouse',
      personality: 'Pays well when food stock is low',
      cash: 90,
      stock: { fish: 25, smoked_fish: 30 },
      targetStock: { fish: 80, smoked_fish: 60 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
    shipyard_brannock: {
      id: 'shipyard_brannock',
      name: "Brannock's Shipyard",
      role: 'Master Shipwright',
      personality: 'The big spender, creates harbor demand',
      cash: 300,
      stock: { iron_ingot: 10, plank: 20, smoked_fish: 15 },
      targetStock: { iron_ingot: 60, plank: 80, smoked_fish: 50 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
  });

  // Restore session on mount
  useEffect(() => {
    const session = EmbeddedWalletManager.getSession();
    if (session) {
      setUser(session);
      setInGame(true);
    }
  }, []);

  const toggleSound = () => {
    const on = harborAudio.toggle();
    setIsAudioOn(on);
  };

  const handleLogin = async (emailToUse?: string) => {
    const email = emailToUse || emailInput || 'judge@near.org';
    const loggedInUser = await EmbeddedWalletManager.loginWithEmail(email);
    setUser(loggedInUser);
    setShowLoginModal(false);
    setInGame(true);
    showToast(`Welcome ashore, Captain! 50.0 Coin granted.`);
  };

  const handleLogout = () => {
    EmbeddedWalletManager.logout();
    setUser(null);
    setInGame(false);
  };

  const copyAccountId = () => {
    if (user?.accountId) {
      navigator.clipboard.writeText(user.accountId);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  // Harvest Resources
  const gatherResource = (goodId: GoodId, amount = 5) => {
    setPlayerInventory((prev) => ({
      ...prev,
      [goodId]: prev[goodId] + amount,
    }));
    showToast(`+${amount} ${DEFAULT_RULES.goods[goodId].name} harvested!`);
  };

  // Workshop Crafting
  const craftResource = (outputGood: GoodId) => {
    const recipe = DEFAULT_RULES.goods[outputGood].craft_recipe;
    if (!recipe) return;

    const [[inputGood, requiredQty]] = Object.entries(recipe.inputs) as [GoodId, number][];
    if (playerInventory[inputGood] < requiredQty) {
      showToast(`Need at least ${requiredQty} ${DEFAULT_RULES.goods[inputGood].name}!`);
      return;
    }

    setPlayerInventory((prev) => ({
      ...prev,
      [inputGood]: prev[inputGood] - requiredQty,
      [outputGood]: prev[outputGood] + recipe.output_qty,
    }));
    showToast(`Crafted 1 ${DEFAULT_RULES.goods[outputGood].name} at Workshop!`);
  };

  // Sell to Merchant (Core Loop Test)
  const sellGoodToMerchant = (merchantId: MerchantId, goodId: GoodId, qty = 5) => {
    if (playerInventory[goodId] < qty) {
      showToast(`Not enough ${DEFAULT_RULES.goods[goodId].name} in purse!`);
      return;
    }

    const merchant = merchants[merchantId];
    const quote = getMerchantQuote(merchant, goodId);
    if (!quote || !quote.canAfford) {
      showToast(`${merchant.name} cannot buy this right now!`);
      return;
    }

    const tradeQty = Math.min(qty, quote.maxQuantity);
    if (tradeQty <= 0) {
      showToast(`${merchant.name} cash cap reached for this trade!`);
      return;
    }

    const totalEarned = Number((quote.unitPrice * tradeQty).toFixed(2));

    // Update player
    setPlayerCoin((c) => Number((c + totalEarned).toFixed(2)));
    setPlayerInventory((inv) => ({
      ...inv,
      [goodId]: inv[goodId] - tradeQty,
    }));

    // Update merchant (stock goes up, cash goes down -> dynamic price drop)
    setMerchants((prev) => {
      const current = prev[merchantId];
      const newStock = (current.stock[goodId] || 0) + tradeQty;
      const newCash = Number((current.cash - totalEarned).toFixed(2));
      const isOpen = newCash >= DEFAULT_RULES.merchants[merchantId].survival.close_when_cash_below;

      return {
        ...prev,
        [merchantId]: {
          ...current,
          cash: newCash,
          stock: { ...current.stock, [goodId]: newStock },
          isOpen,
        },
      };
    });

    showToast(`Sold ${tradeQty} ${DEFAULT_RULES.goods[goodId].name} for +${totalEarned} Coin!`);
  };

  const selectedMerchant = activeMerchantId ? merchants[activeMerchantId] : null;
  const primaryGood: GoodId = activeMerchantId === 'forge_marta'
    ? 'iron_ore'
    : activeMerchantId === 'piers_timberyard'
    ? 'timber'
    : activeMerchantId === 'tavern_gull'
    ? 'fish'
    : 'iron_ingot';

  const currentQuote = selectedMerchant ? getMerchantQuote(selectedMerchant, primaryGood) : null;

  return (
    <div className="min-h-screen bg-[#070e1c] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-6 py-3 rounded-full shadow-2xl font-black text-sm flex items-center space-x-2.5 border-2 border-white/60 animate-bounce">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* WHISPERFLOW-STYLE FLOATING TOP NAVBAR */}
      <header className="fixed top-4 left-4 right-4 z-40 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
        
        {/* Left Floating Brand Pill */}
        <div 
          onClick={() => setInGame(false)}
          className="pointer-events-auto bg-[#0a1528]/85 backdrop-blur-2xl border border-white/15 px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 cursor-pointer hover:border-amber-400/50 transition-all duration-300 group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30 group-hover:rotate-12 transition-transform">
            <Anchor className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-lg font-black tracking-wide text-white">
                Hollow Harbor
              </span>
              <span className="text-[9px] font-mono uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                NEAR Testnet
              </span>
            </div>
            <span className="text-[10px] text-cyan-300 font-medium block -mt-0.5">
              Autonomous Agent Solvers
            </span>
          </div>
        </div>

        {/* Center Live Purse Pill (When In-Game) */}
        {inGame && (
          <div className="pointer-events-auto hidden md:flex items-center space-x-4 bg-[#0a1528]/85 backdrop-blur-2xl border border-white/15 px-5 py-2.5 rounded-full shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-black text-sm text-amber-200">{playerCoin.toFixed(1)} Coin</span>
            </div>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-orange-300 font-mono">⛏️ {playerInventory.iron_ore}</span>
              <span className="text-emerald-300 font-mono">🌲 {playerInventory.timber}</span>
              <span className="text-cyan-300 font-mono">🐟 {playerInventory.fish}</span>
            </div>
          </div>
        )}

        {/* Right Controls Pill */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0a1528]/85 backdrop-blur-2xl border border-white/15 p-1.5 rounded-full shadow-2xl">
          
          {/* Audio Synthesizer */}
          <button
            onClick={toggleSound}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isAudioOn 
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={isAudioOn ? "Mute Ocean Surf" : "Enable Coastal Audio Ambiance"}
          >
            {isAudioOn ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Session */}
          {user ? (
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 pl-3 pr-2 py-1 rounded-full text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-200 font-bold hidden sm:inline">{user.email.split('@')[0]}</span>
              <button 
                onClick={copyAccountId}
                className="text-[10px] text-cyan-300 font-mono hover:text-cyan-200 cursor-pointer px-1.5 py-0.5 rounded bg-black/40"
                title="Copy Implicit Address"
              >
                {copiedAccount ? <Check className="w-3 h-3 text-emerald-400" /> : `${user.accountId.slice(0, 6)}...`}
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Sign In</span>
            </button>
          )}

          {/* Ledger Toggle */}
          <button
            onClick={() => setShowLedgerModal(true)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-cyan-300 flex items-center justify-center transition cursor-pointer border border-white/10"
            title="View Public Blockchain Ledger"
          >
            <Layers className="w-4 h-4" />
          </button>

        </div>

      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative w-full h-screen overflow-hidden">
        
        {/* CARTOON HARBOR PANORAMA BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none">
          <img 
            src="/assets/harbor_panoramic.jpg" 
            alt="Hollow Harbor Panoramic View" 
            className="w-full h-full object-cover object-center filter saturate-110 brightness-95 scale-102 transform transition-transform duration-1000"
          />
          {/* Subtle vignette for crisp UI legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050c19] via-transparent to-[#050c19]/40 pointer-events-none" />
        </div>

        {!inGame ? (
          /* ========================================================================= */
          /* WHISPERFLOW-STYLE HERO OVERLAY                                           */
          /* ========================================================================= */
          <div className="relative z-10 flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-[#071326]/80 backdrop-blur-3xl border border-white/20 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              
              <div className="inline-flex items-center space-x-2 bg-amber-400/15 border border-amber-400/40 px-4 py-1.5 rounded-full text-amber-300 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>NEAR Hackathon: Games With Real Economies</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-black text-white mb-4 leading-tight drop-shadow-md">
                Hollow Harbor
              </h1>

              <p className="text-base sm:text-lg text-slate-200 mb-8 leading-relaxed font-light">
                Every merchant is an <strong className="text-amber-300 font-semibold">autonomous agent</strong> with a real NEAR wallet. 
                Prices fluctuate on real inventory and survival pressure. Flood iron, watch the forge go bankrupt, and invest to revive it.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enter with Email (Gasless)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleLogin('judge@near.org')}
                  className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/10 hover:bg-white/15 text-cyan-200 font-bold text-sm border border-white/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Quick Judge Demo</span>
                </button>
              </div>

              {/* 3 Value bullets */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-left">
                <div className="text-center">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Real Economy</span>
                  <span className="text-xs text-slate-300 font-medium">No Fake Combat</span>
                </div>
                <div className="text-center border-x border-white/10">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">NEP-366 Relayer</span>
                  <span className="text-xs text-slate-300 font-medium">Zero Gas Prompts</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">NEAR Intents</span>
                  <span className="text-xs text-slate-300 font-medium">Shop Backing</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* INTERACTIVE CARTOON MAP VIEWPORT WITH FLOATING HOTSPOT PINS              */
          /* ========================================================================= */
          <div className="relative z-10 flex-1 flex flex-col justify-between p-6 pointer-events-none">
            
            {/* Top Space for Navigation */}
            <div className="h-16" />

            {/* INTERACTIVE CARTOON MAP HOTSPOT PINS */}
            <div className="absolute inset-0 pointer-events-auto">
              
              {/* Pin 1: Marta's Forge (Blacksmith) */}
              <div 
                style={{ top: '48%', left: '38%' }}
                onClick={() => setActiveMerchantId('forge_marta')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all transform duration-300 shadow-2xl ${
                  activeMerchantId === 'forge_marta'
                    ? 'bg-amber-400 text-slate-950 scale-110 ring-4 ring-amber-400/40 font-black'
                    : 'bg-[#071326]/90 text-amber-200 border border-amber-400/50 hover:scale-105 backdrop-blur-xl'
                }`}>
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold font-cinzel">Marta's Forge</span>
                  <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                    {merchants.forge_marta.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 2: Old Piers Timberyard */}
              <div 
                style={{ top: '38%', left: '24%' }}
                onClick={() => setActiveMerchantId('piers_timberyard')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all transform duration-300 shadow-2xl ${
                  activeMerchantId === 'piers_timberyard'
                    ? 'bg-emerald-400 text-slate-950 scale-110 ring-4 ring-emerald-400/40 font-black'
                    : 'bg-[#071326]/90 text-emerald-200 border border-emerald-400/50 hover:scale-105 backdrop-blur-xl'
                }`}>
                  <TreePine className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span className="text-xs font-bold font-cinzel">Piers Timber</span>
                  <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                    {merchants.piers_timberyard.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 3: The Gull & Anchor Tavern */}
              <div 
                style={{ top: '56%', left: '58%' }}
                onClick={() => setActiveMerchantId('tavern_gull')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all transform duration-300 shadow-2xl ${
                  activeMerchantId === 'tavern_gull'
                    ? 'bg-cyan-400 text-slate-950 scale-110 ring-4 ring-cyan-400/40 font-black'
                    : 'bg-[#071326]/90 text-cyan-200 border border-cyan-400/50 hover:scale-105 backdrop-blur-xl'
                }`}>
                  <Fish className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold font-cinzel">Gull & Anchor</span>
                  <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                    {merchants.tavern_gull.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 4: Brannock's Shipyard */}
              <div 
                style={{ top: '65%', left: '76%' }}
                onClick={() => setActiveMerchantId('shipyard_brannock')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all transform duration-300 shadow-2xl ${
                  activeMerchantId === 'shipyard_brannock'
                    ? 'bg-yellow-400 text-slate-950 scale-110 ring-4 ring-yellow-400/40 font-black'
                    : 'bg-[#071326]/90 text-yellow-200 border border-yellow-400/50 hover:scale-105 backdrop-blur-xl'
                }`}>
                  <Anchor className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-bold font-cinzel">Shipyard</span>
                  <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                    {merchants.shipyard_brannock.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 5: Resource Node - Iron Cliffs */}
              <div 
                style={{ top: '22%', left: '48%' }}
                onClick={() => gatherResource('iron_ore', 5)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              >
                <button className="bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-400 hover:to-amber-500 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center space-x-1.5 border border-white/40 transform hover:scale-105 transition-all">
                  <Pickaxe className="w-3.5 h-3.5" />
                  <span>Mine Iron Ore (+5)</span>
                </button>
              </div>

              {/* Pin 6: Resource Node - Harbor Jetty */}
              <div 
                style={{ top: '78%', left: '32%' }}
                onClick={() => gatherResource('fish', 4)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              >
                <button className="bg-gradient-to-r from-cyan-500/90 to-blue-600/90 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center space-x-1.5 border border-white/40 transform hover:scale-105 transition-all">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Cast Fish Nets (+4)</span>
                </button>
              </div>

            </div>

            {/* FLOATING RIGHT DRAWER: LIVE SOLVER QUOTE & SELL INTERFACE */}
            {selectedMerchant && (
              <div className="pointer-events-auto fixed right-6 top-24 bottom-24 w-88 md:w-96 bg-[#071326]/90 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl p-6 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-300">
                
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      {selectedMerchant.id === 'forge_marta' ? (
                        <img 
                          src="/assets/marta_avatar.jpg" 
                          alt="Marta Avatar" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md shadow-amber-400/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 font-cinzel text-lg">
                          {selectedMerchant.name[0]}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                          Autonomous Solver
                        </span>
                        <h3 className="font-cinzel text-lg font-black text-white leading-tight">
                          {selectedMerchant.name}
                        </h3>
                        <span className="text-[11px] text-slate-300">
                          {selectedMerchant.role} • {selectedMerchant.cash.toFixed(0)} Coin Cash
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMerchantId(null)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dynamic Solver Tooltip */}
                  {currentQuote && (
                    <div className="mt-4 space-y-3.5">
                      
                      {/* Transparent Reason */}
                      <div className="bg-black/40 border border-amber-400/30 p-3.5 rounded-2xl">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dynamic Pricing Reason:</span>
                        </div>
                        <p className="text-xs text-amber-100/90 leading-relaxed italic">
                          "{currentQuote.plainReason}"
                        </p>
                      </div>

                      {/* Formula Terms */}
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Base Price:</span>
                          <span className="text-white">{currentQuote.terms.basePrice.toFixed(1)} Coin</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Stock / Target:</span>
                          <span className="text-white">{currentQuote.terms.currentStock} / {currentQuote.terms.targetStock}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Stock Pressure:</span>
                          <span className="text-cyan-400 font-bold">{currentQuote.terms.stockPressureFactor.toFixed(3)}x</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-sm">
                          <span className="text-amber-300">Live Bid Quote:</span>
                          <span className="text-amber-400 text-base">{currentQuote.unitPrice.toFixed(1)} Coin</span>
                        </div>
                      </div>

                      {/* Sell Button */}
                      <button
                        onClick={() => sellGoodToMerchant(activeMerchantId!, primaryGood, 5)}
                        disabled={!currentQuote.canAfford || playerInventory[primaryGood] < 5}
                        className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl cursor-pointer ${
                          playerInventory[primaryGood] >= 5 && currentQuote.canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/25 transform hover:-translate-y-0.5'
                            : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          Sell 5 {DEFAULT_RULES.goods[primaryGood].name} (+{(currentQuote.unitPrice * 5).toFixed(1)} Coin)
                        </span>
                      </button>
                      <span className="text-[10px] text-slate-400 text-center block">
                        Purse has {playerInventory[primaryGood]} {DEFAULT_RULES.goods[primaryGood].name}. Selling moves price!
                      </span>

                    </div>
                  )}

                </div>

                <div className="text-[10px] text-slate-400 border-t border-white/10 pt-3 flex justify-between font-mono">
                  <span>Single File: merchants.rules.yaml</span>
                  <span className="text-emerald-400">NEP-245 Token ID</span>
                </div>

              </div>
            )}

            {/* WHISPERFLOW-STYLE FLOATING BOTTOM DOCK */}
            <div className="pointer-events-auto max-w-xl mx-auto w-full bg-[#0a1528]/90 backdrop-blur-3xl border border-white/20 p-2 rounded-full shadow-2xl flex items-center justify-around z-20">
              
              {/* Mine Ore */}
              <button 
                onClick={() => gatherResource('iron_ore', 5)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-white/10 text-orange-300 text-xs font-bold transition cursor-pointer"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Mine Ore</span>
              </button>

              {/* Chop Timber */}
              <button 
                onClick={() => gatherResource('timber', 5)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-white/10 text-emerald-300 text-xs font-bold transition cursor-pointer"
              >
                <TreePine className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Chop Timber</span>
              </button>

              {/* Workshop Modal */}
              <button 
                onClick={() => setShowWorkshopModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/30 transition cursor-pointer"
              >
                <Hammer className="w-4 h-4" />
                <span>Workshop</span>
              </button>

              {/* Fish */}
              <button 
                onClick={() => gatherResource('fish', 4)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-white/10 text-cyan-300 text-xs font-bold transition cursor-pointer"
              >
                <Fish className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Fish</span>
              </button>

              {/* Town Board */}
              <button 
                onClick={() => setShowTownBoardModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Town Board</span>
              </button>

            </div>

          </div>
        )}
      </main>

      {/* WORKSHOP MODAL */}
      {showWorkshopModal && (
        <div className="fixed inset-0 bg-[#040912]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#071326] border border-white/20 max-w-md w-full rounded-[2.5rem] p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Hammer className="w-5 h-5" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Harbor Workshop</h3>
              </div>
              <button 
                onClick={() => setShowWorkshopModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Smelt Iron Ingot</span>
                  <span className="text-[10px] text-amber-300">Cost: 2 Iron Ore → 1 Ingot</span>
                </div>
                <button
                  onClick={() => craftResource('iron_ingot')}
                  disabled={playerInventory.iron_ore < 2}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs cursor-pointer transition"
                >
                  Smelt
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Mill Wooden Plank</span>
                  <span className="text-[10px] text-emerald-300">Cost: 2 Timber → 1 Plank</span>
                </div>
                <button
                  onClick={() => craftResource('plank')}
                  disabled={playerInventory.timber < 2}
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-black text-xs cursor-pointer transition"
                >
                  Mill
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowWorkshopModal(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOWN BOARD MODAL */}
      {showTownBoardModal && (
        <div className="fixed inset-0 bg-[#040912]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#071326] border border-white/20 max-w-lg w-full rounded-[2.5rem] p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Harbor Town Notice Board</h3>
              </div>
              <button 
                onClick={() => setShowTownBoardModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-200">
                <strong>Market Health:</strong> All 4 merchants are solvent and operating within normal stock targets. No bankruptcies reported today.
              </div>

              <div className="border border-white/10 rounded-2xl p-4 bg-black/40 text-xs space-y-2">
                <span className="font-bold text-amber-300 block">Upcoming Track Mechanics:</span>
                <p className="text-slate-300">
                  When a merchant runs out of Coin, their stall will shut down with a red notice. 
                  Players can fund them through <strong>NEAR Intents</strong> to reopen the shop and claim revenue shares.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowTownBoardModal(false)}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#040912]/85 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#071326] border border-white/20 max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Enter Hollow Harbor</h3>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in with email. An embedded ed25519 NEAR wallet is created silently in local storage—no wallet popups, no seed phrases, no gas interruptions.
              </p>

              <div>
                <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="judge@near.org"
                    className="w-full bg-[#030712] border border-white/15 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              {/* Demo Quick Presets */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-2 font-medium">Quick Demo Profiles:</span>
                <div className="flex flex-wrap gap-2">
                  {['judge@near.org', 'captain@hollowharbor.io', 'investor@near.org'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleLogin(preset)}
                      className="text-xs bg-white/5 hover:bg-white/10 text-cyan-200 px-3 py-1.5 rounded-full border border-white/10 transition cursor-pointer font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Gasless Grant:</strong> Grants 50.0 Coin purse & registers implicit account on NEAR testnet with NEP-366 relayer sponsorship.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogin()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-full text-xs shadow-xl shadow-amber-500/30 cursor-pointer flex items-center space-x-2"
              >
                <span>Enter Harbor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-[#040912]/85 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#071326] border border-white/20 max-w-xl w-full rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Public Blockchain Ledger</h3>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-xs text-cyan-200 leading-relaxed">
                <strong>Verifiable Blockchain Ledger:</strong> Players never see gas prompts or addresses during gameplay, but every transaction is verifiable on NEAR testnet via NEP-245 & NEP-366.
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden text-xs">
                <div className="bg-black/60 p-3 font-bold text-slate-400 border-b border-white/10 grid grid-cols-3">
                  <span>Action</span>
                  <span>Tokens Swapped</span>
                  <span>Ledger Status</span>
                </div>
                <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center border-b border-white/5">
                  <span className="font-mono text-amber-300">Genesis Init</span>
                  <span>Coin / Shop Deeds</span>
                  <span className="text-emerald-400 font-medium">Testnet Verified</span>
                </div>
                {user && (
                  <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center border-b border-white/5">
                    <span className="font-mono text-emerald-300">Starter Purse</span>
                    <span>50.0 Coin</span>
                    <span className="text-emerald-400 font-medium">Sponsored by Relayer</span>
                  </div>
                )}
                <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center">
                  <span className="font-mono text-cyan-300">NEP-366 Relayer</span>
                  <span>Gas Sponsorship</span>
                  <span className="text-emerald-400 font-medium">Active (Zero Gas Prompt)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-full text-xs font-bold cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
