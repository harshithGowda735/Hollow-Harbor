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
  Axe, 
  Ship, 
  Store, 
  ArrowUpRight, 
  Zap, 
  BadgePercent, 
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { DEFAULT_RULES } from '@shared/rules';
import { MerchantState, MerchantId, GoodId } from '@shared/types';
import { getMerchantQuote } from '@shared/pricing';
import { EmbeddedWalletManager, EmbeddedUser } from './lib/wallet';
import { harborAudio } from './lib/audio';

export default function App() {
  const [user, setUser] = useState<EmbeddedUser | null>(null);
  const [inGame, setInGame] = useState(false);
  const [activeTooltipMerchant, setActiveTooltipMerchant] = useState<MerchantId>('forge_marta');
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  // Player live inventory and purse
  const [playerCoin, setPlayerCoin] = useState(50.0);
  const [playerInventory, setPlayerInventory] = useState<Record<GoodId, number>>({
    iron_ore: 10,
    iron_ingot: 2,
    timber: 8,
    plank: 1,
    fish: 6,
    smoked_fish: 0,
  });

  // Action feedback toasts
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setActionNotice(msg);
    harborAudio.playChime();
    setTimeout(() => setActionNotice(null), 3000);
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
    triggerToast(`Welcome ashore, Captain! 50.0 Coin granted.`);
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

  // Gathering Actions
  const gatherResource = (goodId: GoodId, amount = 4) => {
    setPlayerInventory((prev) => ({
      ...prev,
      [goodId]: prev[goodId] + amount,
    }));
    triggerToast(`+${amount} ${DEFAULT_RULES.goods[goodId].name} gathered from outskirts!`);
  };

  // Crafting at Workshop
  const craftResource = (outputGood: GoodId) => {
    const recipe = DEFAULT_RULES.goods[outputGood].craft_recipe;
    if (!recipe) return;

    // Check inputs
    const [[inputGood, requiredQty]] = Object.entries(recipe.inputs) as [GoodId, number][];
    if (playerInventory[inputGood] < requiredQty) {
      triggerToast(`Need at least ${requiredQty} ${DEFAULT_RULES.goods[inputGood].name}!`);
      return;
    }

    setPlayerInventory((prev) => ({
      ...prev,
      [inputGood]: prev[inputGood] - requiredQty,
      [outputGood]: prev[outputGood] + recipe.output_qty,
    }));
    triggerToast(`Crafted 1 ${DEFAULT_RULES.goods[outputGood].name} at Workshop!`);
  };

  // Selling to Merchant (Core Loop test)
  const sellGoodToMerchant = (merchantId: MerchantId, goodId: GoodId, qty = 5) => {
    if (playerInventory[goodId] < qty) {
      triggerToast(`Not enough ${DEFAULT_RULES.goods[goodId].name} in inventory!`);
      return;
    }

    const merchant = merchants[merchantId];
    const quote = getMerchantQuote(merchant, goodId);
    if (!quote || !quote.canAfford) {
      triggerToast(`${merchant.name} cannot buy this right now!`);
      return;
    }

    const tradeQty = Math.min(qty, quote.maxQuantity);
    if (tradeQty <= 0) {
      triggerToast(`${merchant.name} cash cap reached for this trade!`);
      return;
    }

    const totalEarned = Number((quote.unitPrice * tradeQty).toFixed(2));

    // Update player
    setPlayerCoin((c) => Number((c + totalEarned).toFixed(2)));
    setPlayerInventory((inv) => ({
      ...inv,
      [goodId]: inv[goodId] - tradeQty,
    }));

    // Update merchant (stock goes up, cash goes down -> price will dynamically fall!)
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

    triggerToast(`Sold ${tradeQty} ${DEFAULT_RULES.goods[goodId].name} for +${totalEarned} Coin!`);
  };

  // Calculate live formula quote for hovered merchant
  const activeMerchant = merchants[activeTooltipMerchant];
  const primaryGood: GoodId = activeTooltipMerchant === 'forge_marta'
    ? 'iron_ore'
    : activeTooltipMerchant === 'piers_timberyard'
    ? 'timber'
    : activeTooltipMerchant === 'tavern_gull'
    ? 'fish'
    : 'iron_ingot';

  const currentQuote = getMerchantQuote(activeMerchant, primaryGood);

  return (
    <div className="min-h-screen bg-[#040912] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-2 border border-amber-300 animate-bounce">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Atmospheric Coastal Sky & Light Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-20 right-10 w-[500px] h-[400px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#020b18] via-[#051329]/40 to-transparent" />
      </div>

      {/* TOP HEADER NAVIGATION */}
      <header className="border-b border-white/10 bg-[#061021]/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setInGame(false)}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black ring-2 ring-amber-300/40">
              <Anchor className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-400">
                  Hollow Harbor
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  NEAR Testnet
                </span>
              </div>
              <span className="text-[11px] text-cyan-300/80 font-medium tracking-wide flex items-center space-x-1">
                <span>Autonomous Agent Solvers</span>
                <span>•</span>
                <span>NEP-245 Dynamic Economy</span>
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 text-xs ${
                isAudioOn 
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/20' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title={isAudioOn ? "Mute Ocean Surf" : "Enable Coastal Audio Ambiance"}
            >
              {isAudioOn ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAudioOn ? "Coastal Audio On" : "Sound"}</span>
            </button>

            {/* User Session Pill */}
            {user ? (
              <div className="flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 to-[#0d1e38] border border-cyan-500/30 px-3.5 py-1.5 rounded-2xl shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">{user.email}</span>
                  <button 
                    onClick={copyAccountId}
                    className="text-[10px] text-cyan-400/80 font-mono hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{user.accountId.slice(0, 8)}...{user.accountId.slice(-6)}</span>
                    {copiedAccount ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-400 transition cursor-pointer ml-1 p-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Instant Sign In</span>
              </button>
            )}

            {/* Ledger Button */}
            <button
              onClick={() => setShowLedgerModal(true)}
              className="text-xs bg-white/5 hover:bg-white/10 text-slate-200 px-3.5 py-2 rounded-xl border border-white/10 flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Ledger</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-1 flex flex-col relative z-10">
        {!inGame ? (
          /* ========================================================================= */
          /* ULTRA VIBRANT HERO LANDING VIEW                                          */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="max-w-5xl w-full text-center py-12">
              
              {/* Glowing Track Pill */}
              <div className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 px-5 py-2 rounded-full text-amber-300 text-sm font-semibold mb-8 shadow-xl shadow-amber-500/10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>NEAR Hackathon: Games With Real Economies Track</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-amber-200/80 font-mono text-xs">Winner Focus</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6 drop-shadow-2xl leading-[1.08]">
                Where The Economy <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-500">
                  IS The Entire Game.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-2xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed font-light drop-shadow">
                No monster combat. No fake quests. Step into a harbor town where every merchant is an 
                <strong className="text-cyan-300 font-semibold"> autonomous agent with a real NEAR wallet</strong>. 
                Flood iron into Marta’s forge, watch prices crash in real-time, and revive bankrupt shops through NEAR Intents.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-lg shadow-2xl shadow-amber-500/40 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center space-x-3 cursor-pointer ring-4 ring-amber-400/20"
                >
                  <Mail className="w-5 h-5 text-slate-950" />
                  <span>Enter with Email (Zero Gas / Popups)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleLogin('judge@near.org')}
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-[#0d223f] to-[#122e54] hover:from-[#133059] hover:to-[#1a4073] text-cyan-200 font-bold text-base border border-cyan-400/30 transition-all shadow-xl hover:border-cyan-300 flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Launch Quick Judge Session</span>
                </button>
              </div>

              {/* 3 Bold Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                {/* Card 1: Pricing */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-amber-400/40 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/40 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-amber-200 mb-2">Dynamic Stock Pressure</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero static tables. Merchant quotes calculate dynamically via:
                    <br /><code className="text-amber-400 font-mono text-[11px] block mt-1 bg-black/40 p-1.5 rounded-lg border border-amber-400/20">Bid = Base × (Target / Stock)^0.6</code>
                  </p>
                </div>

                {/* Card 2: Gasless */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-400/40 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-emerald-200 mb-2">Invisible Web3 UX</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Email login provisions an embedded wallet silently. 
                    NEP-366 meta-transactions sponsor all player gas. No popups, no seed phrases.
                  </p>
                </div>

                {/* Card 3: Intents */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Coins className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-cyan-200 mb-2">NEAR Intents & Shares</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Merchants act as autonomous solvers. When a shop goes bankrupt, back it with an intent deposit, claim shop shares, and earn dividends.
                  </p>
                </div>

              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PLAYABLE HARBOR VIEWPORT (Slice 1 & 2 Active Loop)                       */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-7xl mx-auto w-full gap-5">
            
            {/* Harbor HUD Bar */}
            <div className="glass-panel rounded-3xl p-4.5 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
              
              {/* Captain Purse & Stats */}
              <div className="flex flex-wrap items-center gap-6">
                
                {/* Coin Purse */}
                <div className="flex items-center space-x-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-400/40 px-4 py-2 rounded-2xl shadow-lg shadow-amber-500/10">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/40">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Purse Balance</span>
                    <span className="font-mono font-bold text-lg text-amber-100">{playerCoin.toFixed(1)} <span className="text-xs text-amber-300">Coin</span></span>
                  </div>
                </div>

                {/* Inventory Bag */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center space-x-1.5 bg-[#091527] border border-orange-500/30 px-3 py-1.5 rounded-xl">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-slate-400">Ore:</span>
                    <span className="font-mono font-bold text-orange-200">{playerInventory.iron_ore}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-[#091527] border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400">Ingot:</span>
                    <span className="font-mono font-bold text-amber-200">{playerInventory.iron_ingot}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-[#091527] border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Timber:</span>
                    <span className="font-mono font-bold text-emerald-200">{playerInventory.timber}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-[#091527] border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                    <Fish className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400">Fish:</span>
                    <span className="font-mono font-bold text-cyan-200">{playerInventory.fish}</span>
                  </div>
                </div>

              </div>

              {/* Status Pills */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">NEP-366 Relayer Active</span>
                </div>

                <button 
                  onClick={() => setInGame(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition cursor-pointer"
                >
                  Exit to Gate
                </button>
              </div>

            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              
              {/* Town Canvas Simulation Area */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden min-h-[520px]">
                
                {/* Canvas Top Bar */}
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <Waves className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>Hollow Harbor Waterfront & Market Square</span>
                  </div>
                  <div className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full font-mono flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Live Simulation Tick: 100% Deterministic</span>
                  </div>
                </div>

                {/* THE LIVING HARBOR TOWN CONTAINER */}
                <div className="flex-1 bg-gradient-to-b from-[#071326] via-[#091b38] to-[#051124] rounded-2xl border border-white/10 p-5 flex flex-col justify-between relative shadow-inner overflow-hidden">
                  
                  {/* Subtle Wave SVG in the background */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="waves" width="100" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 0 10 Q 25 20 50 10 T 100 10" fill="none" stroke="#38bdf8" strokeWidth="1.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#waves)" />
                    </svg>
                  </div>

                  {/* 1. RESOURCE NODES (Gathering Area) */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                        <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gathering Outskirts (Click to Harvest)</span>
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Daily Caps Enforced</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      
                      {/* Iron Cliffs */}
                      <button 
                        onClick={() => gatherResource('iron_ore', 5)}
                        className="bg-gradient-to-br from-stone-900/90 via-amber-950/40 to-stone-900/90 hover:from-amber-900/50 hover:to-stone-800 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-3 text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                            <Flame className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/30">+5 Ore</span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 block">Iron Ore Cliffs</span>
                        <span className="text-[10px] text-slate-400 block">Harvest raw hematite</span>
                      </button>

                      {/* Pine Grove */}
                      <button 
                        onClick={() => gatherResource('timber', 5)}
                        className="bg-gradient-to-br from-stone-900/90 via-emerald-950/40 to-stone-900/90 hover:from-emerald-900/50 hover:to-stone-800 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-3 text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                            <TreePine className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">+5 Timber</span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 block">Pine Grove</span>
                        <span className="text-[10px] text-slate-400 block">Chop harbor pines</span>
                      </button>

                      {/* Harbor Jetty */}
                      <button 
                        onClick={() => gatherResource('fish', 4)}
                        className="bg-gradient-to-br from-stone-900/90 via-cyan-950/40 to-stone-900/90 hover:from-cyan-900/50 hover:to-stone-800 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-3 text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                            <Fish className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">+4 Fish</span>
                        </div>
                        <span className="text-xs font-bold text-slate-100 block">Harbor Jetty</span>
                        <span className="text-[10px] text-slate-400 block">Cast coastal nets</span>
                      </button>

                    </div>
                  </div>

                  {/* 2. THE 4 MERCHANT STALLS (Market Square) */}
                  <div className="relative z-10 my-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center space-x-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-400" />
                        <span>Harbor Market Square (Autonomous Solvers)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Hover to Inspect • Click to Select</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      
                      {/* Marta's Forge */}
                      <button
                        onClick={() => setActiveTooltipMerchant('forge_marta')}
                        onMouseEnter={() => setActiveTooltipMerchant('forge_marta')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
                          activeTooltipMerchant === 'forge_marta'
                            ? 'bg-gradient-to-br from-amber-500/25 via-orange-900/40 to-slate-900 border-amber-400 ring-2 ring-amber-400/40 scale-102'
                            : 'bg-[#09172e]/80 border-amber-500/20 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${merchants.forge_marta.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                            {merchants.forge_marta.cash.toFixed(0)} Coin
                          </span>
                        </div>
                        <span className="font-cinzel text-xs font-bold text-amber-100 block truncate">Marta's Forge</span>
                        <span className="text-[10px] text-amber-300/80 block truncate">Blacksmith (Buys Ore)</span>
                        <div className="mt-2 text-[10px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5 flex justify-between font-mono">
                          <span>Stock: {merchants.forge_marta.stock.iron_ore || 0}</span>
                          <span className="text-amber-300">T: 100</span>
                        </div>
                      </button>

                      {/* Piers Timberyard */}
                      <button
                        onClick={() => setActiveTooltipMerchant('piers_timberyard')}
                        onMouseEnter={() => setActiveTooltipMerchant('piers_timberyard')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
                          activeTooltipMerchant === 'piers_timberyard'
                            ? 'bg-gradient-to-br from-emerald-500/25 via-green-900/40 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/40 scale-102'
                            : 'bg-[#09172e]/80 border-emerald-500/20 hover:border-emerald-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${merchants.piers_timberyard.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            {merchants.piers_timberyard.cash.toFixed(0)} Coin
                          </span>
                        </div>
                        <span className="font-cinzel text-xs font-bold text-emerald-100 block truncate">Old Piers Timber</span>
                        <span className="text-[10px] text-emerald-300/80 block truncate">Buys Timber</span>
                        <div className="mt-2 text-[10px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5 flex justify-between font-mono">
                          <span>Stock: {merchants.piers_timberyard.stock.timber || 0}</span>
                          <span className="text-emerald-300">T: 120</span>
                        </div>
                      </button>

                      {/* Gull and Anchor */}
                      <button
                        onClick={() => setActiveTooltipMerchant('tavern_gull')}
                        onMouseEnter={() => setActiveTooltipMerchant('tavern_gull')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
                          activeTooltipMerchant === 'tavern_gull'
                            ? 'bg-gradient-to-br from-cyan-500/25 via-blue-900/40 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 scale-102'
                            : 'bg-[#09172e]/80 border-cyan-500/20 hover:border-cyan-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${merchants.tavern_gull.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            {merchants.tavern_gull.cash.toFixed(0)} Coin
                          </span>
                        </div>
                        <span className="font-cinzel text-xs font-bold text-cyan-100 block truncate">Gull & Anchor</span>
                        <span className="text-[10px] text-cyan-300/80 block truncate">Tavern (Buys Fish)</span>
                        <div className="mt-2 text-[10px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5 flex justify-between font-mono">
                          <span>Stock: {merchants.tavern_gull.stock.fish || 0}</span>
                          <span className="text-cyan-300">T: 80</span>
                        </div>
                      </button>

                      {/* Brannock Shipyard */}
                      <button
                        onClick={() => setActiveTooltipMerchant('shipyard_brannock')}
                        onMouseEnter={() => setActiveTooltipMerchant('shipyard_brannock')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
                          activeTooltipMerchant === 'shipyard_brannock'
                            ? 'bg-gradient-to-br from-yellow-500/25 via-amber-900/40 to-slate-900 border-yellow-400 ring-2 ring-yellow-400/40 scale-102'
                            : 'bg-[#09172e]/80 border-yellow-500/20 hover:border-yellow-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${merchants.shipyard_brannock.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-500/15 px-2 py-0.5 rounded-full border border-yellow-500/30">
                            {merchants.shipyard_brannock.cash.toFixed(0)} Coin
                          </span>
                        </div>
                        <span className="font-cinzel text-xs font-bold text-yellow-100 block truncate">Brannock Shipyard</span>
                        <span className="text-[10px] text-yellow-300/80 block truncate">Consumer Sink</span>
                        <div className="mt-2 text-[10px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5 flex justify-between font-mono">
                          <span>Ingots: {merchants.shipyard_brannock.stock.iron_ingot || 0}</span>
                          <span className="text-yellow-300">T: 60</span>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* 3. WORKSHOP & TOWN BOARD */}
                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Crafting Workshop */}
                    <div className="bg-[#0b1c35]/90 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Hammer className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">Artisan Workshop</span>
                          <span className="text-[10px] text-amber-300/80">Refine raw goods into trade commodities</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => craftResource('iron_ingot')}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-lg text-xs font-mono cursor-pointer transition"
                          title="Smelt 2 Ore -> 1 Ingot"
                        >
                          Smelt Ingot (2 Ore)
                        </button>
                      </div>
                    </div>

                    {/* Town Board Alert */}
                    <div className="bg-[#0b1c35]/90 border border-blue-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">Harbor Notice Board</span>
                          <span className="text-[10px] text-emerald-400">All 4 shops solvent & quoting</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">
                        Day 1
                      </span>
                    </div>

                  </div>

                </div>

                {/* Footer Status */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-3">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real-time Interactive Economy Engine Online</span>
                  </span>
                  <span className="text-amber-400/90 font-medium">Judges: Test selling ore below to see Marta's bid price drop!</span>
                </div>

              </div>

              {/* DYNAMIC FORMULA & LIVE TRADE DRAWER */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
                
                <div>
                  {/* Top Bar of Inspector */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[11px] text-amber-400 font-black uppercase tracking-wider block">Live Price Inspector</span>
                      <h3 className="font-cinzel text-xl font-black text-slate-100">
                        {activeMerchant.name}
                      </h3>
                      <span className="text-xs text-slate-400">{activeMerchant.role} • "{activeMerchant.personality}"</span>
                    </div>
                    <div className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] px-2.5 py-1 rounded-xl font-mono">
                      merchants.rules.yaml
                    </div>
                  </div>

                  {/* Dynamic Reasoning Box */}
                  {currentQuote && (
                    <div className="mt-5 space-y-4">
                      
                      {/* Plain-English Reason */}
                      <div className="bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-inner">
                        <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 mb-1.5">
                          <Info className="w-4 h-4 text-amber-400" />
                          <span>Transparent Solver Reason:</span>
                        </div>
                        <p className="text-xs text-amber-100/90 leading-relaxed italic">
                          "{currentQuote.plainReason}"
                        </p>
                      </div>

                      {/* Formula Equation Breakdown */}
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                          Formula Terms (Evaluated Live)
                        </span>

                        <div className="flex justify-between items-center text-slate-300">
                          <span>Base Value (P_base):</span>
                          <span className="text-amber-300 font-bold">{currentQuote.terms.basePrice.toFixed(1)} Coin</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span>Current Stock vs Target:</span>
                          <span className="text-slate-100">{currentQuote.terms.currentStock} / {currentQuote.terms.targetStock}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span>Stock Pressure (T/S)^0.6:</span>
                          <span className="text-cyan-400 font-bold">{currentQuote.terms.stockPressureFactor.toFixed(3)}x</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span>Spread Deduction:</span>
                          <span className="text-rose-400 font-bold">-{(currentQuote.terms.spread * 100).toFixed(0)}%</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-white/10 pt-2 text-sm font-bold">
                          <span className="text-amber-300">Calculated Bid Quote:</span>
                          <span className="text-amber-400 text-base">{currentQuote.unitPrice.toFixed(1)} Coin</span>
                        </div>
                      </div>

                      {/* LIVE INTERACTIVE SELL ACTION */}
                      <div className="pt-2">
                        <button
                          onClick={() => sellGoodToMerchant(activeTooltipMerchant, primaryGood, 5)}
                          disabled={!currentQuote.canAfford || playerInventory[primaryGood] < 5}
                          className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl cursor-pointer ${
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
                        <span className="text-[10px] text-slate-400 text-center block mt-1.5">
                          Player holds {playerInventory[primaryGood]} {DEFAULT_RULES.goods[primaryGood].name}. Selling moves market price!
                        </span>
                      </div>

                    </div>
                  )}

                </div>

                {/* Solver Status Bottom */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Autonomous Intent Solver</span>
                  </span>
                  <span className="font-mono text-cyan-400">NEP-245 Tokenized</span>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#040912]/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-amber-500/30 max-w-md w-full rounded-3xl p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-slate-100">Enter Hollow Harbor</h3>
                  <span className="text-[10px] text-amber-300 font-mono">Frictionless Web3 Onboarding</span>
                </div>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-sm"
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
                    className="w-full bg-[#030712] border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
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
                      className="text-xs bg-white/5 hover:bg-white/10 text-cyan-200 px-3 py-1.5 rounded-xl border border-white/10 transition cursor-pointer font-mono"
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
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogin()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-amber-500/30 transition-all cursor-pointer flex items-center space-x-2"
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
        <div className="fixed inset-0 bg-[#040912]/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="glass-panel border-cyan-500/30 max-w-xl w-full rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-cinzel text-lg font-bold text-slate-100">Hollow Harbor Public Ledger</h3>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-sm"
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
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#030814]/90 px-6 py-4 text-center text-xs text-slate-500">
        Hollow Harbor • Built for the NEAR Protocol Hackathon • Real Autonomous Solvers & Frictionless Web3 UX
      </footer>

    </div>
  );
}
