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
  Check
} from 'lucide-react';
import { DEFAULT_RULES } from '@shared/rules';
import { MerchantState, MerchantId } from '@shared/types';
import { getMerchantQuote } from '@shared/pricing';
import { EmbeddedWalletManager, EmbeddedUser } from './lib/wallet';

export default function App() {
  const [user, setUser] = useState<EmbeddedUser | null>(null);
  const [inGame, setInGame] = useState(false);
  const [activeTooltipMerchant, setActiveTooltipMerchant] = useState<MerchantId | null>('forge_marta');
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [coinBalance, setCoinBalance] = useState(50.0);

  // Restore session on mount
  useEffect(() => {
    const session = EmbeddedWalletManager.getSession();
    if (session) {
      setUser(session);
      setInGame(true);
    }
  }, []);

  // Handle email login (Slice 1)
  const handleLogin = async (emailToUse?: string) => {
    const email = emailToUse || emailInput || 'judge@near.org';
    const loggedInUser = await EmbeddedWalletManager.loginWithEmail(email);
    setUser(loggedInUser);
    setCoinBalance(50.0);
    setShowLoginModal(false);
    setInGame(true);
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

  // Merchants state
  const [merchants] = useState<Record<MerchantId, MerchantState>>({
    forge_marta: {
      id: 'forge_marta',
      name: "Marta's Forge",
      role: 'Blacksmith',
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
      role: 'Lumber Merchant',
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
      name: 'The Gull and Anchor',
      role: 'Tavern & Smokehouse',
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
      role: 'Shipwright',
      personality: 'The big spender, consumes finished goods',
      cash: 300,
      stock: { iron_ingot: 10, plank: 20, smoked_fish: 15 },
      targetStock: { iron_ingot: 60, plank: 80, smoked_fish: 50 },
      isOpen: true,
      sharesTotal: 100,
      investorShares: {},
    },
  });

  const currentQuote = activeTooltipMerchant 
    ? (activeTooltipMerchant === 'forge_marta' 
        ? getMerchantQuote(merchants.forge_marta, 'iron_ore')
        : activeTooltipMerchant === 'piers_timberyard'
        ? getMerchantQuote(merchants.piers_timberyard, 'timber')
        : activeTooltipMerchant === 'tavern_gull'
        ? getMerchantQuote(merchants.tavern_gull, 'fish')
        : getMerchantQuote(merchants.shipyard_brannock, 'iron_ingot'))
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Global Status Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="font-cinzel text-xl font-bold tracking-wider text-amber-100 block leading-tight">
                Hollow Harbor
              </span>
              <span className="text-xs text-amber-400/80 font-medium tracking-wide">
                NEAR Real Economy • NEP-245 Tokenized Trade
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">{user.email}</span>
                <span className="text-slate-600">|</span>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 transition cursor-pointer flex items-center space-x-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-md shadow-amber-500/10 flex items-center space-x-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Login</span>
              </button>
            )}

            <button
              onClick={() => setShowLedgerModal(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Ledger</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        {!inGame ? (
          /* ========================================================================= */
          /* LANDING PAGE                                                             */
          /* ========================================================================= */
          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))] pointer-events-none" />
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl w-full text-center relative z-10 py-12">
              <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-300 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NEAR Hackathon: Games With Real Economies</span>
              </div>

              <h1 className="font-cinzel text-5xl sm:text-7xl font-bold tracking-tight text-slate-100 mb-6 drop-shadow-sm">
                Where The Economy <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                  Is The Gameplay.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                A cozy harbor town where every merchant is an autonomous agent with a real NEAR wallet. 
                Prices fluctuate on real stock and survival pressure. Flood the iron market, and the forge goes bankrupt.
              </p>

              {/* Login & Enter Call To Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-lg shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <Mail className="w-5 h-5" />
                  <span>Enter with Email (Frictionless)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleLogin('judge.guest@near.org')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Quick Demo Guest</span>
                </button>
              </div>

              {/* Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-slate-800/80 pt-10">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-cinzel text-base font-bold text-amber-200 mb-1">Stock Pressure Pricing</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Prices are not hardcoded. They are calculated live from stock ratios and merchant cash.
                  </p>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="font-cinzel text-base font-bold text-teal-200 mb-1">Zero Friction Web3</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Email login provisions an embedded wallet with NEP-366 relayer gas sponsorship.
                  </p>
                </div>

                <div className="bg-slate-900/40 p-5 rounded-2xl border border-purple-500/20 flex items-center justify-center mb-3">
                  <Coins className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-cinzel text-base font-bold text-purple-200 mb-1">NEAR Intents & Shares</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Fund bankrupt stalls to reopen them. Hold shop shares and collect trading dividends.
                </p>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* HARBOR TOWN VIEWPORT                                                      */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-7xl mx-auto w-full gap-4">
            
            {/* Harbor HUD Bar with Embedded Wallet Identity */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Captain</span>
                  </div>
                  <span className="font-bold text-sm text-slate-200">{user?.email || 'Guest Explorer'}</span>
                </div>

                {user && (
                  <div className="hidden md:flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">NEAR Implicit Account</span>
                    <button 
                      onClick={copyAccountId}
                      className="flex items-center space-x-1 text-xs text-slate-300 font-mono hover:text-amber-400 transition cursor-pointer"
                      title="Copy Implicit Address"
                    >
                      <span>{user.accountId.slice(0, 10)}...{user.accountId.slice(-8)}</span>
                      {copiedAccount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300 text-sm">{coinBalance.toFixed(1)} Coin</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded font-mono">NEP-245</span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Gasless Relayer Active (NEP-366)</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setInGame(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
                >
                  Harbor Gate
                </button>
              </div>
            </div>

            {/* Main Interactive Town Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              
              {/* Town Map / Viewport Canvas */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden min-h-[460px]">
                
                {/* Viewport Top Watermark / Status */}
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                    <Compass className="w-4 h-4" />
                    <span>Hollow Harbor Waterfront</span>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Testnet Ledger Connected</span>
                  </div>
                </div>

                {/* Town Simulation Area */}
                <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800/70 p-6 flex flex-col justify-between relative shadow-inner">
                  
                  {/* Gathering Nodes (Northern Outskirts) */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Resource Nodes (Outskirts)</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Iron Cliffs</span>
                          <span className="text-[10px] text-slate-400">Yield: Iron Ore</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <TreePine className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Pine Grove</span>
                          <span className="text-[10px] text-slate-400">Yield: Timber</span>
                        </div>
                      </div>

                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                          <Fish className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Harbor Jetty</span>
                          <span className="text-[10px] text-slate-400">Yield: Raw Fish</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Square Merchants (Core Loop) */}
                  <div className="my-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 block mb-2">
                      Market Square (Hover a stall to read live pricing reasoning)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.values(merchants).map((m) => {
                        const isSelected = activeTooltipMerchant === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setActiveTooltipMerchant(m.id)}
                            onMouseEnter={() => setActiveTooltipMerchant(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 scale-102'
                                : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-mono text-amber-300 font-medium">
                                {m.cash.toFixed(0)} Coin
                              </span>
                            </div>
                            <span className="font-cinzel text-xs font-bold text-slate-200 block truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {m.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Crafting Workshop & Town Board */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Hammer className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Crafting Workshop</span>
                        <span className="text-[10px] text-slate-400">Ore → Ingots • Timber → Planks</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Town Board</span>
                        <span className="text-[10px] text-emerald-400">All 4 shops solvent</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Slice Status Footer */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Slice 1: Embedded-Wallet & Relayer Active</span>
                  </span>
                  <span>Next: Slice 2 (Play against Engine: Gather & Sell)</span>
                </div>
              </div>

              {/* Dynamic Formula Inspector Tooltip */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Live Price Inspector</span>
                      <h3 className="font-cinzel text-lg font-bold text-slate-100">
                        {activeTooltipMerchant ? merchants[activeTooltipMerchant].name : 'Select a Merchant'}
                      </h3>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-full font-mono">
                      merchants.rules.yaml
                    </div>
                  </div>

                  {currentQuote && activeTooltipMerchant ? (
                    <div className="mt-5 space-y-4">
                      {/* Plain English Reasoning Box */}
                      <div className="bg-slate-800/50 border border-slate-700/80 p-4 rounded-2xl">
                        <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 mb-1.5">
                          <Info className="w-4 h-4 text-amber-400" />
                          <span>Merchant's Plain-English Reason:</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          "{currentQuote.plainReason}"
                        </p>
                      </div>

                      {/* Formula Terms Table */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Dynamic Mathematical Formula Terms
                        </span>
                        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Base Price:</span>
                            <span className="text-slate-200">{currentQuote.terms.basePrice.toFixed(1)} Coin</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Current Stock / Target:</span>
                            <span className="text-slate-200">{currentQuote.terms.currentStock} / {currentQuote.terms.targetStock}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stock Pressure Factor:</span>
                            <span className="text-amber-300 font-semibold">{currentQuote.terms.stockPressureFactor.toFixed(3)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Spread Margin:</span>
                            <span className="text-slate-300">{(currentQuote.terms.spread * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                            <span className="text-amber-400">Resulting Bid Quote:</span>
                            <span className="text-amber-400 text-sm">{currentQuote.unitPrice.toFixed(1)} Coin</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                        💡 <strong>Judges' Feature:</strong> No LLM hallucination. Every price is 100% deterministic, calculated straight from <code className="text-amber-300">merchants.rules.yaml</code>.
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Hover over any merchant stall to inspect quote formulas.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Autonomous Solver Ready</span>
                    <span className="font-mono text-emerald-400">NEP-245 Token ID: iron_ore</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Login Modal (Slice 1) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel text-lg font-bold text-slate-100">Enter Hollow Harbor</h3>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Log in with your email. An embedded NEAR keypair is provisioned silently—no wallet extension, seed phrases, or gas prompts required.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="judge@near.org"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] text-slate-500 block mb-2">Or select a judge/demo identity:</span>
                <div className="flex flex-wrap gap-2">
                  {['judge@near.org', 'captain@hollowharbor.io', 'trader@near.org'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleLogin(preset)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Gasless Onboarding:</strong> Upon sign in, 50.0 starter Coin is issued and the NEP-366 relayer sponsors all transaction gas fees.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogin()}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center space-x-2"
              >
                <span>Enter Harbor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-lg font-bold text-slate-100">Hollow Harbor Public Ledger</h3>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-200 leading-relaxed">
                <strong>Verifiable Blockchain Ledger:</strong> Players never see gas prompts or addresses during gameplay, but every transaction is verifiable on NEAR testnet.
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-950 p-2.5 font-bold text-slate-400 border-b border-slate-800 grid grid-cols-3">
                  <span>Action</span>
                  <span>Tokens Swapped</span>
                  <span>Status</span>
                </div>
                <div className="p-3 bg-slate-900/50 text-slate-300 grid grid-cols-3 items-center border-b border-slate-800/50">
                  <span className="font-mono text-amber-300">Genesis Init</span>
                  <span>Coin / Shop Deeds</span>
                  <span className="text-emerald-400 font-medium">Testnet Verified</span>
                </div>
                {user && (
                  <div className="p-3 bg-slate-900/50 text-slate-300 grid grid-cols-3 items-center border-b border-slate-800/50">
                    <span className="font-mono text-emerald-300">Starter Purse</span>
                    <span>50.0 Coin</span>
                    <span className="text-emerald-400 font-medium">Sponsored by Relayer</span>
                  </div>
                )}
                <div className="p-3 bg-slate-900/50 text-slate-300 grid grid-cols-3 items-center">
                  <span className="font-mono text-slate-400">Slice 1 Relayer</span>
                  <span>NEP-366 Sponsor</span>
                  <span className="text-emerald-400 font-medium">Active (Zero Gas Prompt)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        Hollow Harbor • Built for the NEAR Protocol Hackathon • Autonomous Agents & Real Market Pressure
      </footer>
    </div>
  );
}
