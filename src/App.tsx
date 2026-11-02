import React, { useState, useEffect } from 'react';
import { 
  Anchor, 
  Coins, 
  Hammer, 
  Layers, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  TreePine, 
  Fish, 
  Building2, 
  Mail, 
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
  Sparkles,
  Axe
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
      role: 'Lumberwright',
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

  // Sell to Merchant
  const sellGoodToMerchant = (merchantId: MerchantId, goodId: GoodId, qty = 5) => {
    if (playerInventory[goodId] < qty) {
      showToast(`Not enough ${DEFAULT_RULES.goods[goodId].name} in inventory!`);
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

    // Update merchant (stock increases, cash drains -> dynamic price drop)
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
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#050c18] text-slate-100 font-sans">
      
      {/* 1. SEAMLESS FULL-BLEED CARTOON HARBOR BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/harbor_panoramic.jpg" 
          alt="Hollow Harbor" 
          className="w-full h-full object-cover object-center filter saturate-105"
        />
        {/* Clean, subtle cinematic gradient vignette for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />
      </div>

      {/* 2. FLOATING ACTION TOAST */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm shadow-2xl flex items-center space-x-2 border border-white/40 animate-bounce">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. CLEAN FLOATING NAVBAR (Directly on the harbor, no dark background bars!) */}
      <header className="absolute top-4 left-4 right-4 z-40 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
        
        {/* Left: Brand Pill */}
        <div 
          onClick={() => setInGame(false)}
          className="pointer-events-auto bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-2xl shadow-xl flex items-center space-x-3 cursor-pointer transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md">
            <Anchor className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base text-white tracking-tight">
              Hollow Harbor
            </span>
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
              NEAR Testnet
            </span>
          </div>
        </div>

        {/* Center: Navigation Links (Clean & Modern) */}
        <nav className="pointer-events-auto hidden md:flex items-center space-x-1 bg-slate-900/80 backdrop-blur-xl border border-white/15 px-2 py-1.5 rounded-2xl shadow-xl text-xs font-semibold text-slate-300">
          <button 
            onClick={() => setInGame(false)}
            className="px-3.5 py-1.5 rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Overview
          </button>
          <button 
            onClick={() => { setInGame(true); setActiveMerchantId('forge_marta'); }}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${inGame ? 'text-amber-300 bg-white/10' : 'hover:text-white hover:bg-white/10'}`}
          >
            Harbor Town
          </button>
          <button 
            onClick={() => { setInGame(true); setShowWorkshopModal(true); }}
            className="px-3.5 py-1.5 rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Workshop
          </button>
          <button 
            onClick={() => { setInGame(true); setShowTownBoardModal(true); }}
            className="px-3.5 py-1.5 rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Town Board
          </button>
          <button 
            onClick={() => setShowLedgerModal(true)}
            className="px-3.5 py-1.5 rounded-xl hover:text-white hover:bg-white/10 transition cursor-pointer text-cyan-300"
          >
            Ledger
          </button>
        </nav>

        {/* Right: User Purse & Controls */}
        <div className="pointer-events-auto flex items-center space-x-2.5">
          
          {/* Purse Counter (when in game) */}
          {inGame && (
            <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl shadow-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-200 font-mono">{playerCoin.toFixed(1)} Coin</span>
            </div>
          )}

          {/* Audio Synthesizer */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl ${
              isAudioOn 
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-md' 
                : 'bg-slate-900/80 border-white/15 text-slate-400 hover:text-white'
            }`}
            title={isAudioOn ? "Mute Ocean Surf" : "Enable Coastal Audio Ambiance"}
          >
            {isAudioOn ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Session */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-2xl text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-medium hidden sm:inline">{user.email.split('@')[0]}</span>
              <button 
                onClick={copyAccountId}
                className="text-[10px] text-cyan-300 font-mono hover:text-cyan-200 cursor-pointer bg-white/5 px-2 py-0.5 rounded-lg border border-white/10"
                title="Copy Implicit Address"
              >
                {copiedAccount ? <Check className="w-3 h-3 text-emerald-400" /> : `${user.accountId.slice(0, 5)}...`}
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-0.5 ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs shadow-lg transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </header>

      {/* 4. MAIN VIEWPORT CONTENT */}
      {!inGame ? (
        /* ========================================================================= */
        /* CLEAN HERO OVERVIEW                                                      */
        /* ========================================================================= */
        <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-slate-900/85 backdrop-blur-2xl border border-white/15 p-8 sm:p-10 rounded-3xl shadow-2xl text-center">
            
            <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-amber-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>NEAR Hackathon: Games With Real Economies</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              A Harbor Where The Economy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-500">
                Is The Gameplay.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed font-normal">
              Every shopkeeper is an autonomous agent with a real NEAR wallet. 
              Prices fluctuate on real inventory and survival pressure. Flood iron to force a shop into bankruptcy, or invest to revive it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleLogin('judge@near.org')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Enter the Harbor (Instant Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-sm border border-white/15 transition-all cursor-pointer"
              >
                Custom Email Login
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">Real Economy</span>
                <span className="text-xs text-slate-300 font-medium">No Fake Combat</span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider block">NEP-366 Relayer</span>
                <span className="text-xs text-slate-300 font-medium">Zero Gas Prompts</span>
              </div>
              <div>
                <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider block">NEAR Intents</span>
                <span className="text-xs text-slate-300 font-medium">Shop Backing</span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* PLAYABLE TOWN VIEWPORT: PINS EXACTLY ON THE CARTOON HARBOR BUILDINGS     */
        /* ========================================================================= */
        <div className="relative z-10 w-full h-full pointer-events-none">
          
          {/* INTERACTIVE HOTSPOT PINS (Accurately mapped to the cartoon buildings) */}
          <div className="absolute inset-0 pointer-events-auto">
            
            {/* 1. Marta's Forge (Stone chimney building with FORGE sign) */}
            <div 
              style={{ top: '44%', left: '67%' }}
              onClick={() => setActiveMerchantId('forge_marta')}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 border transition-all duration-200 shadow-xl ${
                activeMerchantId === 'forge_marta'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 scale-105 ring-4 ring-amber-400/30'
                  : 'bg-slate-900/85 hover:bg-slate-900 text-amber-200 border-amber-400/40 backdrop-blur-md'
              }`}>
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span className="text-xs font-semibold">Marta's Forge</span>
                <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded-full">
                  {merchants.forge_marta.cash.toFixed(0)}c
                </span>
              </div>
            </div>

            {/* 2. Old Piers Timberyard (Waterwheel Lumber Mill building) */}
            <div 
              style={{ top: '47%', left: '85%' }}
              onClick={() => setActiveMerchantId('piers_timberyard')}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 border transition-all duration-200 shadow-xl ${
                activeMerchantId === 'piers_timberyard'
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300 scale-105 ring-4 ring-emerald-400/30'
                  : 'bg-slate-900/85 hover:bg-slate-900 text-emerald-200 border-emerald-400/40 backdrop-blur-md'
              }`}>
                <TreePine className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span className="text-xs font-semibold">Old Piers Timber</span>
                <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded-full">
                  {merchants.piers_timberyard.cash.toFixed(0)}c
                </span>
              </div>
            </div>

            {/* 3. The Gull & Anchor Tavern (Market Square building) */}
            <div 
              style={{ top: '58%', left: '57%' }}
              onClick={() => setActiveMerchantId('tavern_gull')}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 border transition-all duration-200 shadow-xl ${
                activeMerchantId === 'tavern_gull'
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 scale-105 ring-4 ring-cyan-400/30'
                  : 'bg-slate-900/85 hover:bg-slate-900 text-cyan-200 border-cyan-400/40 backdrop-blur-md'
              }`}>
                <Fish className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold">Gull & Anchor</span>
                <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded-full">
                  {merchants.tavern_gull.cash.toFixed(0)}c
                </span>
              </div>
            </div>

            {/* 4. Brannock's Shipyard (Dock building with SHIPYARD sign) */}
            <div 
              style={{ top: '74%', left: '88%' }}
              onClick={() => setActiveMerchantId('shipyard_brannock')}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className={`px-3 py-1.5 rounded-full flex items-center space-x-2 border transition-all duration-200 shadow-xl ${
                activeMerchantId === 'shipyard_brannock'
                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-200 scale-105 ring-4 ring-amber-300/30'
                  : 'bg-slate-900/85 hover:bg-slate-900 text-amber-200 border-amber-400/40 backdrop-blur-md'
              }`}>
                <Anchor className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">Brannock Shipyard</span>
                <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded-full">
                  {merchants.shipyard_brannock.cash.toFixed(0)}c
                </span>
              </div>
            </div>

            {/* 5. Mine Ore (Top Coastal Cliffs) */}
            <div 
              style={{ top: '30%', left: '48%' }}
              onClick={() => gatherResource('iron_ore', 5)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            >
              <button className="bg-slate-900/90 hover:bg-slate-900 text-orange-300 border border-orange-400/50 hover:border-orange-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl flex items-center space-x-1.5 backdrop-blur-md transition-all transform hover:scale-105">
                <Pickaxe className="w-3.5 h-3.5 text-orange-400" />
                <span>Mine Iron Ore (+5)</span>
              </button>
            </div>

            {/* 6. Cast Fish Nets (Wooden Docks) */}
            <div 
              style={{ top: '75%', left: '32%' }}
              onClick={() => gatherResource('fish', 4)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            >
              <button className="bg-slate-900/90 hover:bg-slate-900 text-cyan-300 border border-cyan-400/50 hover:border-cyan-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl flex items-center space-x-1.5 backdrop-blur-md transition-all transform hover:scale-105">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cast Nets (+4 Fish)</span>
              </button>
            </div>

            {/* 7. Chop Timber (Pine Woods on Coast) */}
            <div 
              style={{ top: '44%', left: '23%' }}
              onClick={() => gatherResource('timber', 5)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            >
              <button className="bg-slate-900/90 hover:bg-slate-900 text-emerald-300 border border-emerald-400/50 hover:border-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl flex items-center space-x-1.5 backdrop-blur-md transition-all transform hover:scale-105">
                <Axe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chop Timber (+5)</span>
              </button>
            </div>

          </div>

          {/* RIGHT FLOATING TRADE DRAWER */}
          {selectedMerchant && (
            <div className="pointer-events-auto fixed right-6 top-20 bottom-24 w-84 md:w-96 bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-200">
              
              <div>
                {/* Header with Avatar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    {selectedMerchant.id === 'forge_marta' ? (
                      <img 
                        src="/assets/marta_avatar.jpg" 
                        alt="Marta" 
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-lg shadow-md">
                        {selectedMerchant.name[0]}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                        Autonomous Solver
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {selectedMerchant.name}
                      </h3>
                      <span className="text-xs text-slate-300">
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

                {/* Dynamic Solver Reasoning */}
                {currentQuote && (
                  <div className="mt-4 space-y-3.5">
                    
                    {/* Transparent Plain English Reason */}
                    <div className="bg-black/40 border border-amber-400/30 p-3.5 rounded-2xl">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300 mb-1">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dynamic Pricing Reason:</span>
                      </div>
                      <p className="text-xs text-amber-100/90 leading-relaxed italic font-normal">
                        "{currentQuote.plainReason}"
                      </p>
                    </div>

                    {/* Formula Terms */}
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs font-mono">
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
                        <span className="text-cyan-400 font-semibold">{currentQuote.terms.stockPressureFactor.toFixed(3)}x</span>
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
                      className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer ${
                        playerInventory[primaryGood] >= 5 && currentQuote.canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/20 transform hover:-translate-y-0.5'
                          : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        Sell 5 {DEFAULT_RULES.goods[primaryGood].name} (+{(currentQuote.unitPrice * 5).toFixed(1)} Coin)
                      </span>
                    </button>
                    <span className="text-[10px] text-slate-400 text-center block">
                      Inventory has {playerInventory[primaryGood]} {DEFAULT_RULES.goods[primaryGood].name}. Selling moves market price!
                    </span>

                  </div>
                )}

              </div>

              <div className="text-[10px] text-slate-400 border-t border-white/10 pt-3 flex justify-between font-mono">
                <span>Rule: merchants.rules.yaml</span>
                <span className="text-emerald-400 font-semibold">NEP-245 Token ID</span>
              </div>

            </div>
          )}

          {/* CLEAN FLOATING BOTTOM DOCK */}
          <div className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center space-x-2 z-20">
            
            <button 
              onClick={() => gatherResource('iron_ore', 5)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-white/10 text-orange-300 text-xs font-semibold transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Mine Ore</span>
            </button>

            <button 
              onClick={() => gatherResource('timber', 5)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-white/10 text-emerald-300 text-xs font-semibold transition cursor-pointer"
            >
              <TreePine className="w-4 h-4 text-emerald-400" />
              <span>Chop Timber</span>
            </button>

            <button 
              onClick={() => setShowWorkshopModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Hammer className="w-4 h-4" />
              <span>Workshop</span>
            </button>

            <button 
              onClick={() => gatherResource('fish', 4)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-white/10 text-cyan-300 text-xs font-semibold transition cursor-pointer"
            >
              <Fish className="w-4 h-4 text-cyan-400" />
              <span>Fish</span>
            </button>

            <button 
              onClick={() => setShowTownBoardModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Town Board</span>
            </button>

          </div>

        </div>
      )}

      {/* WORKSHOP MODAL */}
      {showWorkshopModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Hammer className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Harbor Workshop</h3>
              </div>
              <button 
                onClick={() => setShowWorkshopModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-3">
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Smelt Iron Ingot</span>
                  <span className="text-[10px] text-amber-300">Cost: 2 Iron Ore → 1 Ingot</span>
                </div>
                <button
                  onClick={() => craftResource('iron_ingot')}
                  disabled={playerInventory.iron_ore < 2}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer transition"
                >
                  Smelt
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Mill Wooden Plank</span>
                  <span className="text-[10px] text-emerald-300">Cost: 2 Timber → 1 Plank</span>
                </div>
                <button
                  onClick={() => craftResource('plank')}
                  disabled={playerInventory.timber < 2}
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer transition"
                >
                  Mill
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowWorkshopModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOWN BOARD MODAL */}
      {showTownBoardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 max-w-lg w-full rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Harbor Town Notice Board</h3>
              </div>
              <button 
                onClick={() => setShowTownBoardModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-3">
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

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowTownBoardModal(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Enter Hollow Harbor</h3>
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
                    className="w-full bg-slate-950 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
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

              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-start space-x-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  <strong>Gasless Grant:</strong> Grants 50.0 Coin purse & registers implicit account on NEAR testnet with NEP-366 relayer sponsorship.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogin()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
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
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 max-w-xl w-full rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Public Blockchain Ledger</h3>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4 font-sans text-xs">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-2xl text-cyan-200 leading-relaxed">
                <strong>Verifiable Blockchain Ledger:</strong> Players never see gas prompts or addresses during gameplay, but every transaction is verifiable on NEAR testnet via NEP-245 & NEP-366.
              </div>

              <div className="border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-black/60 p-3 font-bold text-slate-400 border-b border-white/10 grid grid-cols-3">
                  <span>Action</span>
                  <span>Tokens Swapped</span>
                  <span>Ledger Status</span>
                </div>
                <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center border-b border-white/5 font-mono">
                  <span className="text-amber-300">Genesis Init</span>
                  <span>Coin / Shop Deeds</span>
                  <span className="text-emerald-400 font-bold">Testnet Verified</span>
                </div>
                {user && (
                  <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center border-b border-white/5 font-mono">
                    <span className="text-emerald-300">Starter Purse</span>
                    <span>50.0 Coin</span>
                    <span className="text-emerald-400 font-bold">Sponsored Relayer</span>
                  </div>
                )}
                <div className="p-3 bg-white/5 text-slate-300 grid grid-cols-3 items-center font-mono">
                  <span className="text-cyan-300">NEP-366 Relayer</span>
                  <span>Gas Sponsorship</span>
                  <span className="text-emerald-400 font-bold">Active (Zero Gas Prompt)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-5 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
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
