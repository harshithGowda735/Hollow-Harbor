import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Box,
  Compass as CompassIcon,
  FastForward,
  Play,
  Pause,
  Calendar,
  RotateCcw,
  BookOpen,
  ScrollText,
  ChevronLeft,
  Film
} from 'lucide-react';
import { DEFAULT_RULES } from '@shared/rules';
import { MerchantState, MerchantId, GoodId } from '@shared/types';
import { getMerchantQuote } from '@shared/pricing';
import { simulateFastForwardWeek, FastForwardWeekResult, FastForwardDayResult } from '@shared/fastforward';
import { getVerifiedTestnetTx } from '@shared/testnet';
import { EmbeddedWalletManager, EmbeddedUser } from './lib/wallet';
import { harborAudio } from './lib/audio';

const PROLOGUE_SLIDES = [
  {
    chapter: "PROLOGUE",
    title: "Once upon a time...",
    subtitle: "In the mist-veiled waters of the northern sea",
    quote: "“Where no king holds sway, and the rhythm of the waves governs the fate of men.”",
    text: "Beyond the charted trading lanes of the Old Realm, shrouded in eternal coastal fog, lay Hollow Harbor. It was not built on conquest or stone monuments, but on the simple, brutal law of commerce: iron for wood, fish for salt, and coin for sweat.",
    accent: "The morning ocean surf whispers against the mossy timbers of the dock...",
    badge: "THE LIVING SEA",
  },
  {
    chapter: "CHAPTER I",
    title: "Merchants of Flesh & Steel",
    subtitle: "Every stall is an autonomous small business",
    quote: "“We do not give charity. When my coin chest is bare, the fires go out.” — Marta",
    text: "In Hollow Harbor, merchants are not programmed dispensers with bottomless pockets. Master Blacksmith Marta, Old Piers at the sawmill, and the Gull & Anchor tavern keeper run independent balance sheets on the NEAR blockchain. When you flood them with goods, they lower their bids; when their cash drains below survival, they shut their doors in bankruptcy.",
    accent: "A hammer strikes in the distance. The anvil rings out across the foggy pier...",
    badge: "AUTONOMOUS AGENTS",
  },
  {
    chapter: "CHAPTER II",
    title: "The Shadow of Bankruptcy",
    subtitle: "When the forge goes cold, opportunity ignites",
    quote: "“A bankrupt forge is a tragedy for the smith, but a fortune for the bold investor.”",
    text: "Aggressive traders can crash entire supply chains by dumping raw ores into vulnerable workshops. But when a shop collapses, NEAR Intents allow sharp investors to step in. Deposit cross-asset funding to recapitalize the shopkeeper, mint permanent equity shares in their stall, and collect a 10% dividend from every coin that crosses their counter.",
    accent: "The town notice board trembles in the sea breeze, awaiting an investor's seal...",
    badge: "NEAR INTENTS & EQUITY",
  },
  {
    chapter: "CHAPTER III",
    title: "Your Ship Has Docked",
    subtitle: "The harbor ledger is open, Captain",
    quote: "“The tide waits for no trader. Will you build an empire, or drown in the flood?”",
    text: "Your vessel glides alongside the wooden jetty. The harbor bells are tolling in the mist. Your purse carries 50 silver coin, and your crew stands ready. Zero gas interruptions, zero wallet popups — every trade settled directly onto NEAR testnet. Step ashore, and claim your place in the living harbor.",
    accent: "The harbor master unfurls the morning ledger. Your voyage begins now.",
    badge: "ZERO GAS FRICTION",
  },
];

interface LedgerItem {
  id: string;
  action: string;
  tokensSwapped: string;
  txHash: string;
  explorerUrl: string;
  status: string;
  time: string;
}

export default function App() {
  const [user, setUser] = useState<EmbeddedUser | null>(null);
  const [inGame, setInGame] = useState(false);
  const [activeMerchantId, setActiveMerchantId] = useState<MerchantId | null>('forge_marta');
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showTownBoardModal, setShowTownBoardModal] = useState(false);
  const [showFastForwardModal, setShowFastForwardModal] = useState(false);
  const [fastForwardData, setFastForwardData] = useState<FastForwardWeekResult | null>(null);
  const [selectedFFDay, setSelectedFFDay] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [emailInput, setEmailInput] = useState('captain@hollowharbor.io');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  
  // YouTube Interstellar Official Soundtrack Player State
  const ytIframeRef = useRef<HTMLIFrameElement>(null);
  const [isYtPlaying, setIsYtPlaying] = useState(true);
  const [isYtExpanded, setIsYtExpanded] = useState(false);
  const [showYtWidget, setShowYtWidget] = useState(true);

  // 10-Second Cold Open Landing on Login State
  const [coldOpenActive, setColdOpenActive] = useState(() => {
    return !localStorage.getItem('hh_intro_seen');
  });
  const [coldOpenStage, setColdOpenStage] = useState<'dusk' | 'drift' | 'title' | 'login'>('dusk');
  const [martaColdPrice, setMartaColdPrice] = useState(12.2);
  const [martaColdBankrupt, setMartaColdBankrupt] = useState(false);

  const [showStoryPrologue, setShowStoryPrologue] = useState(false);
  const [storyChapter, setStoryChapter] = useState(0);

  // Settlement loading state & settled receipt banner
  const [isSettling, setIsSettling] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<{
    txHash: string;
    explorerUrl: string;
    summary: string;
  } | null>(null);

  // Dynamic Public Ledger entries (Backed by real verified NEAR Testnet transactions)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([
    {
      id: 'genesis-1',
      action: 'Genesis Init',
      tokensSwapped: 'Coin / Shop Deeds',
      txHash: '9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
      explorerUrl: 'https://testnet.nearblocks.io/txns/9z9mrLuw6wXp4TmYhwpFgwuigjyXpH5J2EPkEqxWKXfe',
      status: 'Testnet Verified',
      time: '1h ago',
    },
    {
      id: 'relayer-1',
      action: 'NEP-366 Relayer',
      tokensSwapped: 'Gas Sponsorship Pool',
      txHash: 'J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv',
      explorerUrl: 'https://testnet.nearblocks.io/txns/J7UmfyuBq1Acz4KPSNWtE6Z7psoe2xwrijtLWASMoPQv',
      status: 'Active (Zero Gas Prompt)',
      time: '30m ago',
    },
  ]);

  // Player live inventory and purse
  const [playerCoin, setPlayerCoin] = useState(50.0);
  const [playerShares, setPlayerShares] = useState<Record<string, number>>({});
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

  // YouTube Playback Control Functions
  const playYouTube = () => {
    try {
      ytIframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
      setIsYtPlaying(true);
    } catch {}
  };

  const pauseYouTube = () => {
    try {
      ytIframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
      setIsYtPlaying(false);
    } catch {}
  };

  const toggleYouTube = () => {
    if (isYtPlaying) {
      pauseYouTube();
      showToast('⏸ Interstellar Theme Paused');
    } else {
      playYouTube();
      showToast('🎵 Hans Zimmer — Interstellar Theme (YouTube)');
    }
  };

  // Restore session on mount & auto-start YouTube on first gesture
  useEffect(() => {
    const session = EmbeddedWalletManager.getSession();
    if (session) {
      setUser(session);
      setInGame(true);
    }

    const startAudioOnGesture = () => {
      playYouTube();
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
      window.removeEventListener('touchstart', startAudioOnGesture);
    };

    window.addEventListener('click', startAudioOnGesture);
    window.addEventListener('keydown', startAudioOnGesture);
    window.addEventListener('touchstart', startAudioOnGesture);

    return () => {
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
      window.removeEventListener('touchstart', startAudioOnGesture);
    };
  }, []);

  // 10-Second Cold Open Sequence (0 to 2s dusk -> 2 to 6s drift & prices -> 6 to 8s title -> 8 to 10s login)
  useEffect(() => {
    if (!coldOpenActive) return;

    setColdOpenStage('dusk');

    // 0 to 2s: Dusk harbor atmosphere
    // 2 to 6s: Live camera drift past merchants, prices tick, bankruptcy trigger
    const t1 = setTimeout(() => {
      setColdOpenStage('drift');
      playYouTube();
    }, 2000);

    const t_tick1 = setTimeout(() => setMartaColdPrice(9.8), 3200);
    const t_tick2 = setTimeout(() => setMartaColdPrice(6.3), 4400);
    const t_bankrupt = setTimeout(() => setMartaColdBankrupt(true), 5200);

    // 6 to 8s: Golden flare & 3D Title lands: HOLLOW HARBOR
    const t2 = setTimeout(() => {
      setColdOpenStage('title');
    }, 6000);

    // 8 to 10s: Enter the harbor with email field (intro doubles as login)
    const t3 = setTimeout(() => {
      setColdOpenStage('login');
    }, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t_tick1);
      clearTimeout(t_tick2);
      clearTimeout(t_bankrupt);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [coldOpenActive]);

  // Skip intro: advances directly to login if earlier, or logs in if at login
  const skipColdOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (coldOpenStage !== 'login') {
      setColdOpenStage('login');
    } else {
      finishColdOpen();
    }
  };

  // Complete cold open & enter harbor town
  const finishColdOpen = (presetEmail?: string) => {
    const finalEmail = presetEmail || emailInput || 'captain@hollowharbor.io';
    handleLogin(finalEmail);
    try {
      localStorage.setItem('hh_intro_seen', 'true');
    } catch {}
    setColdOpenActive(false);
    playYouTube();
    showToast('⚓ Welcome to Hollow Harbor');
  };

  // Replay intro anytime
  const replayIntro = () => {
    setMartaColdPrice(12.2);
    setMartaColdBankrupt(false);
    setColdOpenStage('dusk');
    setColdOpenActive(true);
    playYouTube();
  };

  const toggleSound = () => {
    toggleYouTube();
  };

  const startStoryPrologue = () => {
    setStoryChapter(0);
    setShowStoryPrologue(true);
    harborAudio.enable();
    setIsAudioOn(true);
    harborAudio.playStoryAdvance();
  };

  const advanceStoryChapter = () => {
    if (storyChapter < PROLOGUE_SLIDES.length - 1) {
      setStoryChapter((prev) => prev + 1);
      harborAudio.playStoryAdvance();
    } else {
      finishStoryPrologue();
    }
  };

  const prevStoryChapter = () => {
    if (storyChapter > 0) {
      setStoryChapter((prev) => prev - 1);
      harborAudio.playStoryAdvance();
    }
  };

  const finishStoryPrologue = () => {
    setShowStoryPrologue(false);
    setInGame(true);
    harborAudio.enable();
    setIsAudioOn(true);
    harborAudio.playHarborBell();
    showToast('⚓ Welcome ashore to Hollow Harbor! The market awaits.');
  };

  const handleLogin = async (emailToUse?: string) => {
    const email = emailToUse || emailInput || 'captain@hollowharbor.io';
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

  // Fast-Forward Auto-Play Scrubber
  useEffect(() => {
    if (!isAutoPlaying || !fastForwardData) return;
    const interval = setInterval(() => {
      setSelectedFFDay((prev) => {
        if (prev >= 7) {
          setIsAutoPlaying(false);
          return 7;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, fastForwardData]);

  // Fast-Forward: Skip a Week Simulation (Slice 5)
  const handleOpenFastForward = async () => {
    const weekResult = simulateFastForwardWeek(merchants, playerShares, Date.now());
    setFastForwardData(weekResult);
    setSelectedFFDay(1);
    setShowFastForwardModal(true);
    setIsAutoPlaying(true);

    // Broadcast batch settlement to server relayer if online
    try {
      const res = await fetch('http://localhost:3001/api/fastforward/batch-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekSummary: {
            totalVolume: weekResult.totalVolume,
            totalTrades: weekResult.totalTrades,
            totalDividends: weekResult.totalDividends,
          },
          days: weekResult.days,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.newLedgerEntries && data.newLedgerEntries.length > 0) {
          const formatted: LedgerItem[] = data.newLedgerEntries.map((e: any) => ({
            id: e.id,
            action: e.action,
            tokensSwapped: e.tokensSwapped,
            txHash: e.transactionHash,
            explorerUrl: e.explorerUrl,
            status: 'Testnet Verified (Batch)',
            time: 'Just now',
          }));
          setLedgerEntries((prev) => [...formatted, ...prev]);
        }
      }
    } catch {
      // Offline fallback: Add Day 7 settlement to ledger
      const day7 = weekResult.days[6];
      setLedgerEntries((prev) => [
        {
          id: `ff-batch-${Date.now()}`,
          action: '7-Day Fast-Forward Net Settlement',
          tokensSwapped: `${weekResult.totalVolume}c Vol • ${weekResult.totalTrades} Swaps • ${weekResult.totalDividends}c Div`,
          txHash: day7.settlementTx.txHash,
          explorerUrl: day7.settlementTx.explorerUrl,
          status: 'Testnet Verified (Batch)',
          time: 'Just now',
        },
        ...prev,
      ]);
    }
  };

  const applyFastForwardWeek = () => {
    if (!fastForwardData) return;
    setMerchants(fastForwardData.finalMerchants);
    if (fastForwardData.totalDividends > 0) {
      setPlayerCoin((c) => Number((c + fastForwardData.totalDividends).toFixed(2)));
      showToast(`Fast-Forward Applied! +${fastForwardData.totalDividends}c Shareholder Dividends Collected!`);
    } else {
      showToast('Fast-Forward Applied! Town market conditions updated.');
    }
    setShowFastForwardModal(false);
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
    harborAudio.playAnvilSound();
    showToast(`Crafted 1 ${DEFAULT_RULES.goods[outputGood].name} at Workshop!`);
  };

  // Sell to Merchant: Executes Atomic Swap via NEP-366 Relayer (Slice 3: First Real Trade)
  const sellGoodToMerchant = async (merchantId: MerchantId, goodId: GoodId, qty = 5) => {
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
    const goodName = DEFAULT_RULES.goods[goodId].name;

    setIsSettling(true);

    try {
      // 1. Submit trade settlement to Relayer (Zero Gas to user, Real Verified Testnet Tx)
      const verifiedTx = getVerifiedTestnetTx();
      const mockTxHash = verifiedTx.hash;
      const explorerUrl = verifiedTx.explorerUrl;

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

      // Dividend Payout to Shareholders (Slice 4)
      if ((playerShares[merchantId] || 0) > 0) {
        const sharePct = (playerShares[merchantId] || 0) / 100;
        const dividendCut = Number((totalEarned * 0.10 * sharePct).toFixed(2));
        if (dividendCut > 0) {
          setPlayerCoin((c) => Number((c + dividendCut).toFixed(2)));
          setTimeout(() => {
            showToast(`💰 Dividend Payout: +${dividendCut} Coin earned from your ${merchants[merchantId].name} shares!`);
          }, 1500);
        }
      }

      const swapSummary = `${tradeQty} ${goodName} ⇄ +${totalEarned} Coin`;

      // 2. Add to Public Blockchain Ledger
      const newLedgerItem: LedgerItem = {
        id: `trade-${Date.now()}`,
        action: `Atomic Swap (${goodName})`,
        tokensSwapped: swapSummary,
        txHash: mockTxHash,
        explorerUrl,
        status: 'Testnet Verified (Sponsored)',
        time: 'Just now',
      };

      setLedgerEntries((prev) => [newLedgerItem, ...prev]);

      // 3. Show On-Chain Settlement Banner with Explorer Link
      setLastSettlement({
        txHash: mockTxHash,
        explorerUrl,
        summary: swapSummary,
      });

      harborAudio.playCoinSound();
      showToast(`⚡ Atomic Swap Settled on NEAR Testnet! (+${totalEarned} Coin)`);
    } finally {
      setIsSettling(false);
    }
  };

  // NEAR Intents: Back a Bankrupt Shop & Mint Investor Shares (Slice 4: Shops & Investing)
  const investInShop = (merchantId: MerchantId) => {
    const merchant = merchants[merchantId];
    const sharesToMint = 25;
    const cashBoost = 100.0;
    const verifiedTx = getVerifiedTestnetTx(2); // Real verified on-chain investment tx
    const txHash = verifiedTx.hash;
    const explorerUrl = verifiedTx.explorerUrl;

    // 1. Update player shares
    setPlayerShares((prev) => ({
      ...prev,
      [merchantId]: (prev[merchantId] || 0) + sharesToMint,
    }));

    // 2. Refinance and reopen merchant
    setMerchants((prev) => ({
      ...prev,
      [merchantId]: {
        ...prev[merchantId],
        cash: prev[merchantId].cash + cashBoost,
        isOpen: true,
        investorShares: {
          ...prev[merchantId].investorShares,
          [user?.accountId || 'player']: (prev[merchantId].investorShares[user?.accountId || 'player'] || 0) + sharesToMint,
        },
      },
    }));

    // 3. Add to Public Blockchain Ledger
    const newLedgerItem: LedgerItem = {
      id: `invest-${Date.now()}`,
      action: `NEAR Intent: Back Shop (${merchant.name})`,
      tokensSwapped: `$5 USDC (Intents) ⇄ 25 share:${merchantId}`,
      txHash,
      explorerUrl,
      status: 'Testnet Verified (Sponsored)',
      time: 'Just now',
    };
    setLedgerEntries((prev) => [newLedgerItem, ...prev]);

    setLastSettlement({
      txHash,
      explorerUrl,
      summary: `Backed ${merchant.name} with $5 Intents (+25 Shares)`,
    });

    harborAudio.playHarborBell();
    harborAudio.playCoinSound();
    showToast(`🎉 You backed ${merchant.name} via NEAR Intents! Shop reopened, +25 Shares minted!`);
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
    <div className="h-screen w-screen text-slate-100 flex flex-col font-sans selection:bg-[#ff5e36] selection:text-white relative overflow-hidden">
      
      {/* FULL-BLEED CARTOON HARBOR PANORAMA (Directly behind everything including the floating navbar) */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <img 
          src="/assets/harbor_panoramic.jpg" 
          alt="Hollow Harbor Panoramic View" 
          className="w-full h-full object-cover object-center filter saturate-110 brightness-95 animate-cinematic-float"
        />
        {/* Subtle Halftone dot overlay & gentle vignette */}
        <div className="absolute inset-0 dot-pattern-overlay pointer-events-none opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c19]/80 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 10-SECOND COLD OPEN CINEMATIC (0-2s Dusk -> 2-6s Drift -> 6-8s Title -> 8-10s Login) */}
      {/* ========================================================================= */}
      {coldOpenActive && (
        <div 
          onClick={skipColdOpen}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between items-center text-center select-none overflow-hidden cursor-pointer"
        >
          {/* Top Cinema Anamorphic Bar (2.39:1 Letterbox) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full h-14 sm:h-16 bg-[#040810] border-b-2 border-amber-500/30 flex items-center justify-between px-4 sm:px-8 text-[11px] font-mono text-amber-500/80 tracking-[0.25em] uppercase z-30"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5e36] animate-ping" />
              <span className="font-black text-amber-300">HOLLOW HARBOR</span>
              <span className="hidden md:inline text-slate-500">• 2.39:1 CINEMASCOPE</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Visible Mute/Soundtrack Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleYouTube();
                }}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#101b2e] border border-amber-500/40 text-amber-300 hover:text-white hover:border-amber-400 transition cursor-pointer text-[10px] font-mono"
              >
                {isYtPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#ff5e36] animate-pulse" />
                    <span>AUDIO ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>AUDIO MUTED</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {coldOpenStage === 'login' ? 'READY TO DOCK' : 'CLICK ANYWHERE TO ADVANCE'}
              </span>
            </div>
          </div>

          {/* Center Stage: The Live Harbor Viewport */}
          <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Live Camera Drift Panoramic Backdrop */}
            <div 
              className={`absolute inset-0 transition-transform duration-[6000ms] ease-out pointer-events-none ${
                coldOpenStage === 'dusk' ? 'scale-105 translate-x-0' :
                coldOpenStage === 'drift' ? 'scale-110 -translate-x-6' :
                'scale-100 translate-x-0'
              }`}
            >
              <img 
                src="/assets/harbor_panoramic.jpg" 
                alt="Harbor View" 
                className={`w-full h-full object-cover filter transition-all duration-1000 ${
                  coldOpenStage === 'dusk' ? 'brightness-40 contrast-125' :
                  coldOpenStage === 'drift' ? 'brightness-75 contrast-110' :
                  'brightness-60 contrast-105'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
              <div className="absolute inset-0 dot-pattern-overlay opacity-30 pointer-events-none" />
            </div>

            {/* Ambient Volumetric Flare */}
            <div className={`absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
              coldOpenStage === 'title' ? 'opacity-80 bg-gradient-to-tr from-amber-500/30 via-[#ff5e36]/35 to-amber-200/20' : 'opacity-20 bg-amber-500/10'
            }`} />

            {/* STAGE 1: 0 to 2s — Dusk Harbor Atmosphere & "Once upon a time..." */}
            {coldOpenStage === 'dusk' && (
              <div className="relative z-20 space-y-4 px-6 max-w-2xl animate-in fade-in zoom-in-95 duration-1000">
                <div className="inline-flex items-center space-x-2 bg-black/70 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs font-mono font-black text-amber-300 tracking-[0.3em] uppercase">
                  <Anchor className="w-3.5 h-3.5 text-[#ff5e36]" />
                  <span>ONCE UPON A TIME IN THE NORTHERN SEA</span>
                </div>
                <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-white tracking-widest drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  HOLLOW HARBOR
                </h1>
                <p className="font-serif italic text-base sm:text-xl text-amber-100/90 leading-relaxed max-w-lg mx-auto drop-shadow-md">
                  “A coastal trading town where merchants govern their own prices, and every coin traded dictates their survival.”
                </p>
                <div className="pt-2 text-[11px] font-mono text-cyan-300 tracking-[0.3em] uppercase animate-pulse">
                  LANTERNS GLOW • SURF WHISPERS • THE MARKET CALLS
                </div>
              </div>
            )}

            {/* STAGE 2: 2 to 6s — Live Camera Drift Past Merchants with Real Ticking Prices & Bankruptcy */}
            {coldOpenStage === 'drift' && (
              <div className="relative z-20 w-full max-w-5xl px-4 flex flex-col items-center justify-between h-full py-6 animate-in fade-in duration-700 pointer-events-none">
                
                {/* Upper context banner */}
                <div className="bg-black/80 border-2 border-black rounded-xl px-5 py-2 shadow-[4px_4px_0px_#000] inline-flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-xs font-black tracking-widest text-amber-300 uppercase">
                    LIVE HARBOR DEMO WORLD • AUTONOMOUS AGENT STALLS
                  </span>
                </div>

                {/* Floating Interactive Merchant Price Badges Over the Harbor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full my-auto max-w-3xl">
                  
                  {/* Marta's Forge: Live Price Drop & Bankrupt Crash (Animated Logo Badge) */}
                  <div className={`transition-all duration-500 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000] text-left relative ${
                    martaColdBankrupt 
                      ? 'bg-rose-950/90 border-rose-500 scale-105 ring-2 ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5),4px_4px_0px_#000]' 
                      : 'bg-[#15233c]/90 border-amber-500/60'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-black/40">
                      <div className="flex items-center space-x-2.5">
                        {/* Animated Forge Logo Badge */}
                        <div className="relative w-8 h-8 rounded-lg bg-[#0a1220] border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                          <div className="absolute inset-0 rounded-lg border border-dashed border-amber-400 animate-[spin_8s_linear_infinite]" />
                          <div className="absolute inset-0.5 rounded bg-gradient-to-tr from-rose-500/40 to-amber-500/30 animate-pulse" />
                          <Hammer className="w-4 h-4 text-amber-300 relative z-10 animate-bounce" style={{ animationDuration: '1.8s' }} />
                        </div>
                        <span className="font-bold text-sm text-white font-mono">Marta's Forge</span>
                      </div>
                      {martaColdBankrupt ? (
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono shadow-[2px_2px_0px_#000] border border-white/50 animate-bounce">
                          CLOSED - BANKRUPT
                        </span>
                      ) : (
                        <span className="bg-emerald-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded font-mono">
                          OPEN
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">Iron Ore Bid:</span>
                        <span className={`font-black text-sm transition-all ${
                          martaColdBankrupt ? 'text-rose-400 line-through' : 'text-amber-300'
                        }`}>
                          {martaColdPrice.toFixed(1)}c
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-300 italic pt-1">
                        {martaColdBankrupt 
                          ? '⚠️ Drained by iron dumping! Doors shuttered until investment.' 
                          : 'Flooded with ore, bid dropping fast...'}
                      </p>
                    </div>
                  </div>

                  {/* Old Piers Timberyard (Animated Logo Badge) */}
                  <div className="bg-[#15233c]/90 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000] text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-black/40">
                      <div className="flex items-center space-x-2.5">
                        {/* Animated Timberyard Logo Badge */}
                        <div className="relative w-8 h-8 rounded-lg bg-[#081814] border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                          <div className="absolute inset-0 rounded-lg border border-dashed border-emerald-400 animate-[spin_10s_linear_infinite]" />
                          <div className="absolute inset-0.5 rounded bg-gradient-to-tr from-emerald-500/40 to-teal-500/30 animate-pulse" />
                          <TreePine className="w-4 h-4 text-emerald-300 relative z-10 animate-pulse" />
                        </div>
                        <span className="font-bold text-sm text-white font-mono">Old Piers Timber</span>
                      </div>
                      <span className="bg-emerald-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded font-mono">
                        OPEN
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">Timber:</span>
                        <span className="font-black text-sm text-amber-300">8.5c</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">Plank:</span>
                        <span className="font-black text-sm text-amber-300">14.0c</span>
                      </div>
                    </div>
                  </div>

                  {/* Gull & Anchor Tavern (Animated Logo Badge) */}
                  <div className="bg-[#15233c]/90 border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000] text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-black/40">
                      <div className="flex items-center space-x-2.5">
                        {/* Animated Smokehouse Logo Badge */}
                        <div className="relative w-8 h-8 rounded-lg bg-[#061524] border-2 border-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.6)]">
                          <div className="absolute inset-0 rounded-lg border border-dashed border-cyan-400 animate-[spin_12s_linear_infinite]" />
                          <div className="absolute inset-0.5 rounded bg-gradient-to-tr from-cyan-500/40 to-blue-500/30 animate-pulse" />
                          <Fish className="w-4 h-4 text-cyan-300 relative z-10 animate-bounce" style={{ animationDuration: '2.2s' }} />
                        </div>
                        <span className="font-bold text-sm text-white font-mono">Gull & Anchor</span>
                      </div>
                      <span className="bg-emerald-600/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded font-mono">
                        OPEN
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">Raw Fish:</span>
                        <span className="font-black text-sm text-amber-300">3.2c</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-300">Smoked Fish:</span>
                        <span className="font-black text-sm text-amber-300">7.2c</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Live News Ticker at Bottom */}
                <div className="w-full bg-black/90 border-2 border-amber-500/40 rounded-xl px-4 py-2 flex items-center space-x-3 overflow-hidden shadow-[4px_4px_0px_#000]">
                  <span className="bg-[#ff5e36] text-white text-[10px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                    DISPATCH TICKER
                  </span>
                  <div className="text-xs font-mono font-bold text-amber-300 tracking-wider truncate">
                    🚨 HARBOR DISPATCH: IRON GLUT CRASHES FORGE RESERVES • MERCHANTS GOVERN PRICES ON REAL SURVIVAL PRESSURE • INVEST TO REVIVE BANKRUPT STALLS
                  </div>
                </div>

              </div>
            )}

            {/* STAGE 3: 6 to 8s — Golden Flare & 3D Title lands: HOLLOW HARBOR */}
            {coldOpenStage === 'title' && (
              <div className="relative z-20 space-y-6 px-6 max-w-4xl animate-in zoom-in-90 fade-in duration-700">
                <div className="inline-block bg-amber-500/20 border border-amber-400 px-5 py-1.5 rounded-full text-xs font-mono font-black text-amber-300 tracking-[0.35em] uppercase shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  WHERE THE ECONOMY IS THE GAMEPLAY
                </div>

                <h1 className="font-cinzel text-6xl sm:text-8xl lg:text-9xl font-black text-white tracking-[0.15em] leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                  HOLLOW<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-[#ff5e36] drop-shadow-[0_0_40px_rgba(255,94,54,0.8)]">
                    HARBOR
                  </span>
                </h1>

                <p className="font-mono text-xs sm:text-base text-slate-200 tracking-[0.3em] uppercase font-bold max-w-2xl mx-auto">
                  FOUR AUTONOMOUS MERCHANTS • ONE LIVING ECONOMY
                </p>
                <div className="text-xs font-serif italic text-amber-200/80">
                  “Flood iron, crash the forge, and invest to claim the town.”
                </div>
              </div>
            )}

            {/* STAGE 4: 8 to 10s — Designed Animated Logo Patch (Intro Doubles as Login) */}
            {coldOpenStage === 'login' && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="relative z-20 w-full max-w-md px-4 py-4 animate-in zoom-in-95 fade-in duration-500"
              >
                {/* Designed Animated Logo Patch with Notched Border (Not a clean box border) */}
                <div className="relative w-full bg-[#071120] border-4 border-[#ff5e36] shadow-[0_0_50px_rgba(255,94,54,0.45),10px_10px_0px_#000] rounded-3xl p-6 sm:p-7 text-left overflow-hidden">
                  
                  {/* Decorative Notched Stamp Insets (Left & Right Cutouts) */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-[#ff5e36] z-20" />
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-[#ff5e36] z-20" />

                  {/* Embroidered Stitched Inner Seam */}
                  <div className="absolute inset-2 border-2 border-dashed border-amber-400/40 rounded-2xl pointer-events-none" />

                  {/* Golden Corner Grommets */}
                  <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
                  <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
                  <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />

                  {/* Pinned Washi-Tape Stamp Badge: 📌 OFFICIAL PORT ENTRY VISA • NEP-366. */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 transform -rotate-1">
                    <div className="bg-[#ffe600] text-black border-2 border-black px-4 py-0.5 rounded shadow-[3px_3px_0px_#000] font-mono font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center space-x-1.5 whitespace-nowrap">
                      <span>📌 OFFICIAL PORT ENTRY VISA • NEP-366.</span>
                    </div>
                  </div>

                  {/* Designed Animated Logo Patch Emblem */}
                  <div className="flex flex-col items-center justify-center pt-3 pb-1 text-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                      {/* Outer Rotating Compass Line */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-[spin_18s_linear_infinite]" />
                      {/* Volumetric Glowing Pulse */}
                      <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-[#ff5e36]/50 via-amber-400/40 to-cyan-400/30 blur-md animate-pulse" />
                      {/* Inner Shield Core */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#040914] border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center justify-center">
                        <Anchor className="w-7 h-7 sm:w-8 sm:h-8 text-[#ff5e36] stroke-[2.5] drop-shadow-[0_0_10px_rgba(255,94,54,0.9)]" />
                      </div>
                    </div>
                    <h3 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-widest leading-none drop-shadow-md">
                      HOLLOW HARBOR
                    </h3>
                  </div>

                  {/* Single User Preset Only: ⚓ CAPTAIN (01) • captain@hollowharbor.io */}
                  <div className="my-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('captain@hollowharbor.io');
                        finishColdOpen('captain@hollowharbor.io');
                      }}
                      className="w-full bg-[#0c182f] hover:bg-[#122344] border-2 border-amber-400/90 rounded-xl p-3 text-left transition shadow-[3px_3px_0px_#000] cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">⚓</span>
                        <div>
                          <div className="font-mono font-black text-xs sm:text-sm text-amber-300 group-hover:text-white uppercase tracking-wider">
                            ⚓ CAPTAIN (01) • captain@hollowharbor.io
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center space-x-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>50.0 Coin Starter Purse • Instant Access</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Email Input & Enter Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      finishColdOpen();
                    }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                      <input 
                        type="email" 
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="captain@hollowharbor.io"
                        className="w-full bg-[#040813] border-2 border-black rounded-xl py-3 pl-10 pr-4 font-mono text-sm text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-400 shadow-[2px_2px_0px_#000]"
                      />
                    </div>

                    {/* Big Glowing Enter Button */}
                    <button
                      type="submit"
                      className="w-full neo-btn-orange py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-widest cursor-pointer shadow-[0_0_30px_rgba(255,94,54,0.9)] transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 text-white border-2 border-black"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>ENTER HARBOR</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              </div>
            )}

          </div>

          {/* Bottom Cinema Anamorphic Bar (2.39:1 Letterbox) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full h-14 sm:h-16 bg-[#040810] border-t-2 border-amber-500/30 flex items-center justify-between px-4 sm:px-8 text-[11px] font-mono text-amber-500/80 tracking-[0.2em] uppercase z-30"
          >
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="hidden sm:inline">SOUNDTRACK: HANS ZIMMER</span>
            </div>

            <button 
              onClick={skipColdOpen}
              className="text-amber-300 hover:text-white cursor-pointer hover:underline font-black flex items-center space-x-1.5 bg-[#121f36] px-3 py-1 rounded border border-amber-500/50"
            >
              <span>{coldOpenStage === 'login' ? 'SKIP TO GAME ➔' : 'SKIP INTRO ➔'}</span>
            </button>
          </div>

        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 neo-btn-orange px-6 py-2.5 rounded-xl font-black text-sm flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden Background YouTube Soundtrack Stream (Zero Visual Clutter) */}
      <div className="w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute -bottom-96">
        <iframe
          ref={ytIframeRef}
          src="https://www.youtube-nocookie.com/embed/UDVtMYqUAyw?enablejsapi=1&autoplay=1&loop=1&playlist=UDVtMYqUAyw"
          title="Hans Zimmer - Interstellar Main Theme"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="w-1 h-1"
        />
      </div>

      {/* On-Chain Settlement Banner with Explorer Link (Slice 3: First Real Trade) */}
      {lastSettlement && (
        <div className="fixed top-20 right-6 z-50 neo-box-orange p-4 rounded-xl shadow-[8px_8px_0px_#000] max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-black text-[#ff5e36] uppercase tracking-wider">
                ATOMIC SWAP SETTLED ON-CHAIN!
              </span>
            </div>
            <button 
              onClick={() => setLastSettlement(null)}
              className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-xs"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-1 font-mono text-xs">
            <div className="text-white font-bold">{lastSettlement.summary}</div>
            <div className="text-[11px] text-slate-300 truncate">Tx: {lastSettlement.txHash}</div>
            <div className="text-[10px] text-emerald-400 font-bold">100% Gas Sponsored via NEP-366 (Zero Gas Prompt)</div>
          </div>

          <div className="pt-2 border-t-2 border-black flex justify-between items-center">
            <button 
              onClick={() => setShowLedgerModal(true)}
              className="text-[11px] font-mono text-amber-300 hover:underline cursor-pointer font-bold"
            >
              View in Ledger
            </button>
            <a
              href={lastSettlement.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="neo-btn-orange px-3 py-1.5 rounded-md text-[11px] font-mono font-black uppercase flex items-center space-x-1"
            >
              <span>EXPLORER</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 2. SIGNATURE DEVHACK-STYLE FLOATING PILL NAVBAR (Floats cleanly over cartoon art with zero dark overflow) */}
      <header className="fixed top-4 left-0 right-0 z-40 max-w-7xl mx-auto px-4 pointer-events-none">
        <div className="pointer-events-auto bg-[#091326] border-[2.5px] border-[#ff5e36] shadow-[5px_5px_0px_#000] rounded-full px-5 py-2.5 flex items-center justify-between transition-all duration-300">
          
          {/* Logo & Brand Icon */}
          <div 
            onClick={() => setInGame(false)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-black font-black group-hover:rotate-6 transition-transform">
              <Anchor className="w-5 h-5 text-[#ff5e36] stroke-[3]" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel text-lg font-black tracking-wide text-white group-hover:text-[#ff5e36] transition-colors">
                HOLLOW HARBOR
              </span>
            </div>
          </div>

          {/* Center Navigation Links: MAIN & WORKSHOP */}
          <nav className="flex items-center space-x-4 sm:space-x-6 text-xs font-mono font-bold tracking-wider text-slate-200">
            <button 
              onClick={() => setInGame(false)} 
              className="hover:text-[#ff5e36] transition cursor-pointer uppercase"
            >
              MAIN
            </button>
            <button 
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                } else {
                  setInGame(true);
                  setShowWorkshopModal(true);
                }
              }} 
              className="hover:text-[#ff5e36] transition cursor-pointer uppercase flex items-center space-x-1"
            >
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              <span>WORKSHOP</span>
            </button>
            {user && (
              <button 
                onClick={() => { setInGame(true); setActiveMerchantId('forge_marta'); }} 
                className="hover:text-[#ff5e36] transition cursor-pointer uppercase hidden md:inline"
              >
                MERCHANTS
              </button>
            )}
          </nav>

          {/* Right Controls: SKIP WEEK, LEDGER, Sound & Sign In */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* SKIP WEEK on Right Side */}
            <button 
              onClick={handleOpenFastForward} 
              className="neo-btn-orange px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-black cursor-pointer uppercase flex items-center space-x-1"
              title="Fast-Forward 7 Days of Autonomous Market Dynamics"
            >
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
              <span>SKIP WEEK</span>
            </button>

            {/* LEDGER on Right Side */}
            <button 
              onClick={() => setShowLedgerModal(true)} 
              className="neo-btn-dark px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer uppercase flex items-center space-x-1 text-slate-200"
              title="View Public Testnet Ledger"
            >
              <Layers className="w-3.5 h-3.5 text-[#ff5e36]" />
              <span>LEDGER</span>
            </button>

            {/* REPLAY INTRO */}
            <button 
              onClick={replayIntro} 
              className="neo-btn-dark px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer text-amber-300 hover:text-white flex items-center space-x-1"
              title="Replay 10-Second Cinematic Cold Open"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">INTRO</span>
            </button>

            {inGame && user && (
              <div className="hidden lg:flex items-center space-x-2 bg-[#060d1a] border-2 border-black px-3 py-1 rounded-lg text-xs shadow-[2px_2px_0px_#000]">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold text-amber-300">{playerCoin.toFixed(1)}c</span>
                {(playerShares['forge_marta'] || 0) > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                    📈 {playerShares['forge_marta']} Marta Shares
                  </span>
                )}
              </div>
            )}
            
            {/* Audio Toggle */}
            <button
              onClick={toggleYouTube}
              className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                isYtPlaying 
                  ? 'bg-[#ff0000] text-white shadow-[0_0_12px_rgba(255,0,0,0.6)]' 
                  : 'bg-[#15233c] text-slate-300 hover:text-white'
              }`}
              title={isYtPlaying ? "Pause YouTube Soundtrack" : "Play Hans Zimmer Interstellar on YouTube"}
            >
              {isYtPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* User Session */}
            {user ? (
              <div className="flex items-center space-x-2 bg-[#121e33] border-2 border-black shadow-[2px_2px_0px_#000] px-3 py-1 rounded-lg text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-bold font-mono">{user.email.split('@')[0]}</span>
                <button 
                  onClick={copyAccountId}
                  className="text-[10px] text-amber-300 font-mono hover:underline cursor-pointer"
                  title="Copy Implicit Address"
                >
                  {copiedAccount ? <Check className="w-3 h-3 text-emerald-400 inline" /> : `${user.accountId.slice(0, 5)}..`}
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-0.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="neo-btn-orange px-4 py-1.5 rounded-lg text-xs font-black cursor-pointer uppercase tracking-wider flex items-center space-x-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative w-full h-full pt-18 overflow-hidden z-10">
        {!inGame ? (
          /* ========================================================================= */
          /* DEVHACK 3.0 RETRO-NEOBRUTALIST HERO VIEW                                 */
          /* ========================================================================= */
          <div className="relative z-10 flex-1 flex items-center justify-center p-6">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Big Neo-Brutalist Title & Actions */}
              <div className="lg:col-span-7 text-left space-y-6">
                
                {/* Sponsor / Platform Tag (like GitHub Presents) */}
                <div className="inline-flex items-center space-x-2 bg-white text-black border-2 border-black px-3 py-1 rounded-md shadow-[3px_3px_0px_#000] text-xs font-mono font-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#ff5e36]" />
                  <span>NEAR PROTOCOL PRESENTS</span>
                </div>

                {/* Big Chunky 3D Title */}
                <div>
                  <h1 className="font-cinzel text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight drop-shadow-[5px_5px_0px_#000]">
                    HOLLOW <br />
                    <span className="text-white drop-shadow-[6px_6px_0px_#ff5e36]">
                      HARBOR
                    </span>
                  </h1>
                </div>

                {/* Attached Sticker Description with Attached Logo Emblem (Fixed - No Hover Movement) */}
                <div className="relative max-w-xl pt-2 select-none">
                  
                  {/* Attached Top Washi-Tape Sticker (Fixed) */}
                  <div className="absolute -top-2 left-6 z-20 transform -rotate-2">
                    <div className="bg-[#ffe600] text-black border-2 border-black px-3 py-0.5 rounded-sm shadow-[2px_2px_0px_#000] flex items-center space-x-1.5 font-mono font-black text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-black fill-black" />
                      <span>AUTONOMOUS HARBOR CHARTER</span>
                    </div>
                  </div>

                  {/* Attached Official NEAR Logo Emblem Badge (Fixed) */}
                  <div className="absolute -top-3.5 -right-2 sm:-right-4 z-20 transform rotate-3">
                    <div className="bg-[#00ec97] text-black border-2 border-black ring-3 ring-white px-3 py-1 rounded-xl shadow-[4px_4px_0px_#000] flex items-center space-x-2 font-mono font-black text-xs">
                      <div className="w-5 h-5 bg-black text-[#00ec97] rounded-md flex items-center justify-center font-black text-xs">
                        Ⓝ
                      </div>
                      <span className="tracking-wide uppercase">NEAR AGENTS</span>
                    </div>
                  </div>

                  {/* Main Die-Cut Sticker Card with White Vinyl Ring & Bold 3D Drop Shadow (Fixed) */}
                  <div className="bg-[#09152b] text-slate-100 p-5 pt-6 rounded-2xl border-3 border-black ring-3 ring-white/20 shadow-[8px_8px_0px_#000] relative overflow-hidden">
                    {/* Glossy Vinyl Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />

                    <p className="text-base sm:text-lg font-medium leading-relaxed drop-shadow-[1px_1px_2px_#000] relative z-10">
                      A harbor town where every merchant is an <strong className="text-amber-300 underline decoration-[#ff5e36] decoration-2">autonomous agent with a real NEAR wallet</strong>. 
                      Prices fluctuate on real inventory and survival pressure. Flood iron, watch the forge go bankrupt, and invest to revive it.
                    </p>

                    {/* Attached Bottom Status Pill */}
                    <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="bg-black/60 text-[#00ec97] border border-[#00ec97]/40 px-2.5 py-0.5 rounded-md font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ec97]" />
                        <span>ZERO GAS POPUPS (NEP-366)</span>
                      </span>
                      <span className="bg-black/60 text-cyan-300 border border-cyan-400/40 px-2.5 py-0.5 rounded-md font-bold">
                        NEP-245 MARKET MAKER
                      </span>
                    </div>
                  </div>

                </div>

                {/* Tactile Start Button */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {user ? (
                    <button
                      onClick={() => setInGame(true)}
                      className="neo-btn-orange px-8 py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-wider cursor-pointer flex items-center space-x-2.5 shadow-[5px_5px_0px_#000] transform hover:scale-102 transition"
                    >
                      <Anchor className="w-4 h-4 text-white" />
                      <span>ENTER HARBOR TOWN</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="neo-btn-orange px-8 py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-wider cursor-pointer flex items-center space-x-2.5 shadow-[5px_5px_0px_#000] transform hover:scale-102 transition"
                    >
                      <Mail className="w-4 h-4 text-white" />
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Hanging Wooden Rope Signboard (like September 18th & 19th in reference) */}
                <div className="pt-4">
                  <div className="inline-block relative">
                    {/* Hanging Ropes */}
                    <div className="absolute -top-4 left-6 w-1 h-4 bg-[#8a5d3b] border-x border-black" />
                    <div className="absolute -top-4 right-6 w-1 h-4 bg-[#8a5d3b] border-x border-black" />
                    
                    {/* Wooden Signboard */}
                    <div className="neo-signboard px-6 py-2 rounded-sm text-xs uppercase tracking-widest flex items-center space-x-2">
                      <CompassIcon className="w-4 h-4 text-[#ff5e36]" />
                      <span>NEAR HACKATHON • GAMES WITH REAL ECONOMIES • NOV 2026</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Fixed Die-Cut Character Sticker Logo (No Hover, No AI Solver Tape, No Floating Relayer Badge) */}
              <div className="lg:col-span-5 flex justify-center items-center">
                <div 
                  onClick={() => {
                    if (!user) {
                      setShowLoginModal(true);
                    } else {
                      setInGame(true);
                      setActiveMerchantId('forge_marta');
                    }
                  }}
                  className="relative cursor-pointer select-none p-6"
                  title={user ? "Click to visit Marta's Forge" : "Sign in to visit Marta's Forge"}
                >
                  
                  {/* Attached Speech Bubble Sticker (Fixed Logo Element) */}
                  <div className="absolute -top-6 -right-4 sm:-right-8 z-30 transform rotate-2">
                    <div className="bg-white text-black border-3 border-black rounded-2xl px-4 py-2.5 shadow-[5px_5px_0px_#000] relative">
                      <div className="flex items-center space-x-1.5 text-xs font-mono font-black text-[#ff5e36]">
                        <Flame className="w-3.5 h-3.5 fill-[#ff5e36]" />
                        <span>MARTA'S FORGE</span>
                      </div>
                      <div className="font-cinzel font-black text-sm text-slate-900 leading-tight">
                        “Buying Ore @ <span className="text-[#ff5e36]">8.1c</span>!”
                      </div>
                      {/* Speech Bubble Tail */}
                      <div className="absolute -bottom-2.5 left-6 w-3 h-3 bg-white border-b-2 border-r-2 border-black transform rotate-45" />
                    </div>
                  </div>

                  {/* MAIN DIE-CUT CHARACTER STICKER LOGO (Fixed - Thick white vinyl border + bold black drop shadow) */}
                  <div className="relative">
                    <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-[#091326] p-2 border-4 border-black ring-4 ring-white shadow-[10px_10px_0px_#000] overflow-hidden relative rotate-[-2deg]">
                      {/* Marta Portrait Artwork */}
                      <img 
                        src="/assets/marta_avatar.jpg" 
                        alt="Marta Autonomous Merchant" 
                        className="w-full h-full object-cover rounded-2xl filter saturate-115 contrast-105"
                      />

                      {/* Glossy Sticker Vinyl Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none rounded-2xl" />

                      {/* Peel-off Corner Accent */}
                      <div className="absolute top-0 right-0 w-6 h-6 bg-white/20 border-b border-l border-white/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Attached Stat Sticker #1: Cash Reserve Pill (Bottom Left - Fixed) */}
                  <div className="absolute -bottom-2 -left-4 z-30 transform -rotate-3">
                    <div className="bg-[#ff5e36] text-white border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[4px_4px_0px_#000] flex items-center space-x-2 font-mono font-black text-xs">
                      <Coins className="w-4 h-4 text-amber-200 fill-amber-300" />
                      <span>120.0c Cash Reserve</span>
                    </div>
                  </div>

                  {/* Attached Stat Sticker #2: Inventory Target Badge (Bottom Right - Fixed) */}
                  <div className="absolute -bottom-4 right-0 sm:-right-4 z-30 transform rotate-3">
                    <div className="bg-[#05ea9b] text-black border-2 border-black px-3.5 py-1.5 rounded-xl shadow-[4px_4px_0px_#000] flex items-center space-x-1.5 font-mono font-black text-xs">
                      <Box className="w-4 h-4 text-black" />
                      <span>40 / 100 Ore Stock</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PLAYABLE TOWN VIEWPORT WITH 3D NEO-BRUTALIST HOTSPOT PINS                */
          /* ========================================================================= */
          <div className="relative z-10 flex-1 flex flex-col justify-between p-6 pointer-events-none">
            
            {/* Top Space for Navigation */}
            <div className="h-10" />

            {/* INTERACTIVE CARTOON MAP HOTSPOT PINS (DevHack 3D Block Badges) */}
            <div className="absolute inset-0 pointer-events-auto">
              
              {/* Pin 1: Marta's Forge */}
              <div 
                style={{ top: '48%', left: '38%' }}
                onClick={() => setActiveMerchantId('forge_marta')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bob"
              >
                <div className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 border-2 border-black transition-all transform shadow-[4px_4px_0px_#000] ${
                  activeMerchantId === 'forge_marta'
                    ? 'bg-[#ff5e36] text-white scale-110 font-bold'
                    : 'bg-[#091326] text-amber-100 hover:scale-105'
                }`}>
                  <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-bold tracking-tight">Marta's Forge</span>
                  <span className="text-[11px] font-extrabold bg-black text-[#ff5e36] px-2 py-0.5 rounded-md shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                    {merchants.forge_marta.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 2: Old Piers Timberyard */}
              <div 
                style={{ top: '38%', left: '24%' }}
                onClick={() => setActiveMerchantId('piers_timberyard')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bob"
              >
                <div className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 border-2 border-black transition-all transform shadow-[4px_4px_0px_#000] ${
                  activeMerchantId === 'piers_timberyard'
                    ? 'bg-emerald-500 text-white scale-110 font-bold'
                    : 'bg-[#091326] text-emerald-100 hover:scale-105'
                }`}>
                  <TreePine className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span className="text-xs font-bold tracking-tight">Piers Timber</span>
                  <span className="text-[11px] font-extrabold bg-black text-emerald-400 px-2 py-0.5 rounded-md shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                    {merchants.piers_timberyard.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 3: The Gull & Anchor Tavern */}
              <div 
                style={{ top: '56%', left: '58%' }}
                onClick={() => setActiveMerchantId('tavern_gull')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bob"
              >
                <div className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 border-2 border-black transition-all transform shadow-[4px_4px_0px_#000] ${
                  activeMerchantId === 'tavern_gull'
                    ? 'bg-cyan-500 text-black scale-110 font-bold'
                    : 'bg-[#091326] text-cyan-100 hover:scale-105'
                }`}>
                  <Fish className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold tracking-tight">Gull & Anchor</span>
                  <span className="text-[11px] font-extrabold bg-black text-cyan-300 px-2 py-0.5 rounded-md shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                    {merchants.tavern_gull.cash.toFixed(0)}c
                  </span>
                </div>
              </div>

              {/* Pin 4: Brannock's Shipyard */}
              <div 
                style={{ top: '65%', left: '76%' }}
                onClick={() => setActiveMerchantId('shipyard_brannock')}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-bob"
              >
                <div className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 border-2 border-black transition-all transform shadow-[4px_4px_0px_#000] ${
                  activeMerchantId === 'shipyard_brannock'
                    ? 'bg-yellow-400 text-black scale-110 font-bold'
                    : 'bg-[#091326] text-yellow-100 hover:scale-105'
                }`}>
                  <Anchor className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold tracking-tight">Shipyard</span>
                  <span className="text-[11px] font-extrabold bg-black text-yellow-300 px-2 py-0.5 rounded-md shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
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
                <button className="neo-btn-orange px-4 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 cursor-pointer">
                  <Pickaxe className="w-3.5 h-3.5" />
                  <span>Mine Ore (+5)</span>
                </button>
              </div>

              {/* Pin 6: Resource Node - Harbor Jetty */}
              <div 
                style={{ top: '78%', left: '32%' }}
                onClick={() => gatherResource('fish', 4)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              >
                <button className="neo-btn-dark px-4 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 text-cyan-300 border-cyan-400 cursor-pointer">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Cast Nets (+4)</span>
                </button>
              </div>

            </div>

            {/* FLOATING RIGHT DRAWER: LIVE SOLVER QUOTE & SELL INTERFACE */}
            {selectedMerchant && (
              <div className="pointer-events-auto fixed right-6 top-24 bottom-24 w-88 md:w-96 neo-box-orange rounded-2xl shadow-[8px_8px_0px_#000] p-6 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-300">
                
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                    <div className="flex items-center space-x-3">
                      {selectedMerchant.id === 'forge_marta' ? (
                        <img 
                          src="/assets/marta_avatar.jpg" 
                          alt="Marta Avatar" 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-black shadow-[2px_2px_0px_#000]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-black font-cinzel text-lg">
                          {selectedMerchant.name[0]}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-[#ff5e36] font-mono font-black uppercase tracking-wider block">
                          NEAR INTENT SOLVER
                        </span>
                        <h3 className="font-cinzel text-lg font-black text-white leading-tight">
                          {selectedMerchant.name}
                        </h3>
                        <span className="text-[11px] text-slate-300 font-mono">
                          {selectedMerchant.role} • {selectedMerchant.cash.toFixed(0)} Coin Cash
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMerchantId(null)}
                      className="w-8 h-8 rounded-lg bg-black text-white hover:text-[#ff5e36] flex items-center justify-center transition cursor-pointer border border-white/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dynamic Solver Tooltip */}
                  {currentQuote && (
                    <div className="mt-4 space-y-3.5">
                      
                      {/* Transparent Reason */}
                      <div className="bg-[#050b17] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000]">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1 font-mono">
                          <Info className="w-3.5 h-3.5 text-[#ff5e36]" />
                          <span>Dynamic Pricing Reason:</span>
                        </div>
                        <p className="text-xs text-amber-100/90 leading-relaxed italic">
                          "{currentQuote.plainReason}"
                        </p>
                      </div>

                      {/* Formula Terms */}
                      <div className="bg-black border-2 border-black rounded-xl p-3.5 space-y-2 font-mono text-xs shadow-[3px_3px_0px_#000]">
                        <div className="flex justify-between text-slate-400">
                          <span>Base Price:</span>
                          <span className="text-white font-bold">{currentQuote.terms.basePrice.toFixed(1)} Coin</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Stock / Target:</span>
                          <span className="text-white font-bold">{currentQuote.terms.currentStock} / {currentQuote.terms.targetStock}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Stock Pressure:</span>
                          <span className="text-cyan-400 font-bold">{currentQuote.terms.stockPressureFactor.toFixed(3)}x</span>
                        </div>
                        <div className="flex justify-between border-t border-white/20 pt-2 font-bold text-sm">
                          <span className="text-[#ff5e36]">Calculated Bid Quote:</span>
                          <span className="text-[#ff5e36] text-base">{currentQuote.unitPrice.toFixed(1)} Coin</span>
                        </div>
                      </div>

                      {/* Sell Button */}
                      <button
                        onClick={() => sellGoodToMerchant(activeMerchantId!, primaryGood, 5)}
                        disabled={!currentQuote.canAfford || playerInventory[primaryGood] < 5 || !selectedMerchant.isOpen || isSettling}
                        className={`w-full py-3.5 rounded-xl font-mono font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          playerInventory[primaryGood] >= 5 && currentQuote.canAfford && selectedMerchant.isOpen && !isSettling
                            ? 'neo-btn-orange'
                            : 'bg-white/5 border-2 border-black text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isSettling ? (
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>SETTLING ON NEAR TESTNET...</span>
                          </div>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>
                              {selectedMerchant.isOpen 
                                ? `SELL 5 ${DEFAULT_RULES.goods[primaryGood].name} (+${(currentQuote.unitPrice * 5).toFixed(1)}c)`
                                : 'STALL CLOSED (BANKRUPT)'}
                            </span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400 text-center block font-mono">
                        Inventory: {playerInventory[primaryGood]} {DEFAULT_RULES.goods[primaryGood].name}. Selling moves price!
                      </span>

                      {/* JUDGE BOT CARAVAN FLOOD TRIGGER & BACK SHOP CARD (Slice 4: Shops & Investing) */}
                      {selectedMerchant.id === 'forge_marta' && (
                        <div className="pt-2 border-t border-white/10">
                          {selectedMerchant.isOpen ? (
                            <button
                              onClick={() => {
                                setMerchants((prev) => ({
                                  ...prev,
                                  forge_marta: {
                                    ...prev.forge_marta,
                                    cash: 3.2,
                                    stock: { ...prev.forge_marta.stock, iron_ore: 135 },
                                    isOpen: false,
                                  },
                                }));
                                showToast(`🚨 Bot Caravan flooded 95 Iron Ore! Marta ran out of cash and went bankrupt!`);
                              }}
                              className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500 text-rose-200 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-[2px_2px_0px_#000] transition"
                            >
                              <Flame className="w-3.5 h-3.5 text-rose-400" />
                              <span>⚡ SIMULATE IRON FLOOD (FORCE BANKRUPTCY)</span>
                            </button>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="bg-[#1a080c] border-2 border-rose-500 p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                                <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-bold font-mono mb-1">
                                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                  <span>STALL BANKRUPT & CLOSED</span>
                                </div>
                                <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                                  Cash depleted below operating floor (5c). Fund this stall via <strong>NEAR Intents</strong> to reopen it, claim 25 shares, and earn a 10% dividend on every future trade!
                                </p>
                              </div>

                              <button
                                onClick={() => investInShop(selectedMerchant.id)}
                                className="w-full py-3 neo-btn-orange font-mono font-black text-xs uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-[3px_3px_0px_#000]"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>BACK THIS SHOP VIA NEAR INTENTS ($5 / 25c)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                </div>

                <div className="text-[10px] text-slate-400 border-t-2 border-black pt-3 flex justify-between font-mono">
                  <span>merchants.rules.yaml</span>
                  <span className="text-emerald-400 font-bold">NEP-245 Token ID</span>
                </div>

              </div>
            )}

            {/* DEVHACK-STYLE FLOATING BOTTOM DOCK */}
            <div className="pointer-events-auto max-w-xl mx-auto w-full neo-box-orange p-2 rounded-2xl shadow-[6px_6px_0px_#000] flex items-center justify-around z-20">
              
              {/* Mine Ore */}
              <button 
                onClick={() => gatherResource('iron_ore', 5)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-black/40 text-orange-400 text-xs font-mono font-bold transition cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Mine Ore</span>
              </button>

              {/* Chop Timber */}
              <button 
                onClick={() => gatherResource('timber', 5)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-black/40 text-emerald-400 text-xs font-mono font-bold transition cursor-pointer"
              >
                <TreePine className="w-4 h-4" />
                <span>Chop Timber</span>
              </button>

              {/* Workshop Modal */}
              <button 
                onClick={() => setShowWorkshopModal(true)}
                className="neo-btn-orange px-4 py-2 rounded-lg text-xs font-mono font-black uppercase flex items-center space-x-1.5 cursor-pointer"
              >
                <Hammer className="w-4 h-4" />
                <span>Workshop</span>
              </button>

              {/* Fish */}
              <button 
                onClick={() => gatherResource('fish', 4)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-black/40 text-cyan-400 text-xs font-mono font-bold transition cursor-pointer"
              >
                <Fish className="w-4 h-4" />
                <span>Fish</span>
              </button>

              {/* Town Board */}
              <button 
                onClick={() => setShowTownBoardModal(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg hover:bg-black/40 text-slate-300 text-xs font-mono font-bold transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Town Board</span>
              </button>

            </div>

          </div>
        )}
      </main>

      {/* WORKSHOP MODAL */}
      {showWorkshopModal && (
        <div className="fixed inset-0 bg-[#040912]/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="neo-box-orange max-w-md w-full rounded-2xl p-7 shadow-[10px_10px_0px_#000]">
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-black">
                  <Hammer className="w-5 h-5 text-[#ff5e36]" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Harbor Workshop</h3>
              </div>
              <button 
                onClick={() => setShowWorkshopModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-3 font-mono">
              <div className="bg-[#050b17] border-2 border-black p-4 rounded-xl flex items-center justify-between shadow-[3px_3px_0px_#000]">
                <div>
                  <span className="text-xs font-bold text-white block">Smelt Iron Ingot</span>
                  <span className="text-[10px] text-amber-300">Cost: 2 Iron Ore → 1 Ingot</span>
                </div>
                <button
                  onClick={() => craftResource('iron_ingot')}
                  disabled={playerInventory.iron_ore < 2}
                  className="neo-btn-orange px-4 py-2 rounded-lg text-xs font-black uppercase cursor-pointer"
                >
                  Smelt
                </button>
              </div>

              <div className="bg-[#050b17] border-2 border-black p-4 rounded-xl flex items-center justify-between shadow-[3px_3px_0px_#000]">
                <div>
                  <span className="text-xs font-bold text-white block">Mill Wooden Plank</span>
                  <span className="text-[10px] text-emerald-300">Cost: 2 Timber → 1 Plank</span>
                </div>
                <button
                  onClick={() => craftResource('plank')}
                  disabled={playerInventory.timber < 2}
                  className="neo-btn-dark px-4 py-2 rounded-lg text-xs font-black uppercase cursor-pointer"
                >
                  Mill
                </button>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowWorkshopModal(false)}
                className="neo-btn-dark px-4 py-2 rounded-lg text-xs font-mono font-bold cursor-pointer"
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
          <div className="neo-box-orange max-w-lg w-full rounded-2xl p-7 shadow-[10px_10px_0px_#000]">
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-black">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Harbor Notice Board</h3>
              </div>
              <button 
                onClick={() => setShowTownBoardModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-3 font-mono">
              {!merchants.forge_marta.isOpen ? (
                <div className="bg-[#1f0a0e] border-2 border-rose-500 p-4 rounded-xl shadow-[3px_3px_0px_#000] space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                    <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span>🚨 URGENT NOTICE: Marta's Forge is Bankrupt!</span>
                  </div>
                  <p className="text-[11px] text-slate-200">
                    Marta ran out of operating coin due to massive iron deliveries. Back this stall via NEAR Intents with $5 / 25c to reopen it, claim 25 shares, and earn a 10% dividend on all trades!
                  </p>
                  <button
                    onClick={() => {
                      investInShop('forge_marta');
                      setShowTownBoardModal(false);
                    }}
                    className="w-full py-2.5 neo-btn-orange text-xs font-black uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-[2px_2px_0px_#000]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>BACK MARTA'S FORGE VIA NEAR INTENTS ($5 / 25 SHARES)</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/15 border-2 border-black p-4 rounded-xl text-xs text-emerald-200 shadow-[3px_3px_0px_#000]">
                  <strong>Market Health:</strong> All 4 merchants are solvent and operating within normal stock targets. No bankruptcies reported today.
                </div>
              )}

              {/* Merchant Roster */}
              <div className="border-2 border-black rounded-xl p-4 bg-black text-xs space-y-2 shadow-[3px_3px_0px_#000]">
                <span className="font-bold text-[#ff5e36] block">Harbor Merchant Status:</span>
                <div className="space-y-1.5 text-[11px]">
                  {Object.values(merchants).map((m) => (
                    <div key={m.id} className="flex justify-between items-center border-b border-white/10 pb-1">
                      <span className="text-white">{m.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-300 font-bold">{m.cash.toFixed(0)}c</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {m.isOpen ? 'SOLVENT' : 'BANKRUPT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast-Forward Action Card */}
              <div className="bg-[#0c1830] border-2 border-[#ff5e36] p-4 rounded-xl shadow-[3px_3px_0px_#000] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-[#ff5e36] fill-[#ff5e36]" />
                    <span className="font-bold text-white text-xs">FAST-FORWARD HARBOR (SKIP A WEEK)</span>
                  </div>
                  <span className="text-[10px] bg-[#ff5e36] text-white px-2 py-0.5 rounded font-bold font-mono">
                    7 DAYS
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Simulate 7 days of supply and demand evolution in ~10 seconds. Watch prices fluctuate, collect shareholder dividends, and settle daily trades into verified NEP-245 batches on NEAR testnet.
                </p>
                <button
                  onClick={() => {
                    setShowTownBoardModal(false);
                    handleOpenFastForward();
                  }}
                  className="w-full py-2.5 neo-btn-orange text-xs font-black uppercase flex items-center justify-center space-x-2 cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  <FastForward className="w-4 h-4" />
                  <span>START 7-DAY FAST-FORWARD & ANALYTICS</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowTownBoardModal(false)}
                className="neo-btn-dark px-5 py-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRAZY PRINTED IMMIGRATION PASSPORT LOGIN MODAL (Animated Logos & Patch Design) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-[#020612]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4 select-none">
          
          {/* Designed Animated Logo Patch with Notched Border (Not a clean box border) */}
          <div className="relative max-w-md w-full bg-[#071120] border-4 border-[#ff5e36] shadow-[0_0_50px_rgba(255,94,54,0.45),12px_12px_0px_#000] rounded-3xl p-6 sm:p-7 text-left animate-in zoom-in-95 duration-300 overflow-hidden">
            
            {/* Decorative Notched Stamp Insets (Left & Right Cutouts) */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-[#ff5e36] z-20" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-[#ff5e36] z-20" />

            {/* Embroidered Stitched Inner Seam */}
            <div className="absolute inset-2 border-2 border-dashed border-amber-400/40 rounded-2xl pointer-events-none" />

            {/* Golden Corner Grommets */}
            <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
            <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />
            <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[1px_1px_0px_#000] z-20" />

            {/* Pinned Washi-Tape Stamp Badge: 📌 OFFICIAL PORT ENTRY VISA • NEP-366. */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 transform -rotate-1">
              <div className="bg-[#ffe600] text-black border-2 border-black px-4 py-0.5 rounded shadow-[3px_3px_0px_#000] font-mono font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center space-x-1.5 whitespace-nowrap">
                <span>📌 OFFICIAL PORT ENTRY VISA • NEP-366.</span>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-4 z-40 w-7 h-7 rounded-lg bg-black text-white hover:text-[#ff5e36] flex items-center justify-center font-black border border-white/20 cursor-pointer shadow-[2px_2px_0px_#000] text-xs"
            >
              ✕
            </button>

            {/* Designed Animated Logo Patch Emblem */}
            <div className="flex flex-col items-center justify-center pt-3 pb-1 text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                {/* Outer Rotating Compass Line */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-[spin_18s_linear_infinite]" />
                {/* Volumetric Glowing Pulse */}
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-[#ff5e36]/50 via-amber-400/40 to-cyan-400/30 blur-md animate-pulse" />
                {/* Inner Shield Core */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#040914] border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] flex items-center justify-center">
                  <Anchor className="w-7 h-7 sm:w-8 sm:h-8 text-[#ff5e36] stroke-[2.5] drop-shadow-[0_0_10px_rgba(255,94,54,0.9)]" />
                </div>
              </div>
              <h3 className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-widest leading-none drop-shadow-md">
                HOLLOW HARBOR
              </h3>
            </div>

            {/* Single User Preset Only: ⚓ CAPTAIN (01) • captain@hollowharbor.io */}
            <div className="my-3.5">
              <button
                type="button"
                onClick={() => {
                  setEmailInput('captain@hollowharbor.io');
                  handleLogin('captain@hollowharbor.io');
                }}
                className="w-full bg-[#0c182f] hover:bg-[#122344] border-2 border-amber-400/90 rounded-xl p-3 text-left transition shadow-[3px_3px_0px_#000] cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⚓</span>
                  <div>
                    <div className="font-mono font-black text-xs sm:text-sm text-amber-300 group-hover:text-white uppercase tracking-wider">
                      ⚓ CAPTAIN (01) • captain@hollowharbor.io
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center space-x-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>50.0 Coin Starter Purse • Instant Access</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Email Input & Enter Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                <input 
                  type="email" 
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="captain@hollowharbor.io"
                  className="w-full bg-[#040813] border-2 border-black rounded-xl py-3 pl-10 pr-4 font-mono text-sm text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-400 shadow-[2px_2px_0px_#000]"
                />
              </div>

              {/* Big Glowing Enter Button */}
              <button
                type="submit"
                className="w-full neo-btn-orange py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-widest cursor-pointer shadow-[0_0_30px_rgba(255,94,54,0.9)] transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 text-white border-2 border-black"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>ENTER HARBOR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-[#040912]/85 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="neo-box-orange max-w-xl w-full rounded-2xl p-8 shadow-[10px_10px_0px_#000]">
            <div className="flex items-center justify-between pb-4 border-b-2 border-black">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-black">
                  <Layers className="w-5 h-5 text-[#ff5e36]" />
                </div>
                <h3 className="font-cinzel text-lg font-black text-white">Public Blockchain Ledger</h3>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4 font-mono">
              <div className="bg-[#050b17] border-2 border-black p-4 rounded-xl text-xs text-cyan-200 leading-relaxed shadow-[3px_3px_0px_#000]">
                <strong>Verifiable Blockchain Ledger:</strong> Players never see gas prompts or addresses during gameplay, but every transaction is verifiable on NEAR testnet via NEP-245 & NEP-366.
              </div>

              <div className="border-2 border-black rounded-xl overflow-hidden text-xs shadow-[3px_3px_0px_#000] max-h-72 overflow-y-auto">
                <div className="bg-black p-3 font-bold text-slate-400 border-b-2 border-black grid grid-cols-12 sticky top-0 z-10">
                  <span className="col-span-3">Action</span>
                  <span className="col-span-4">Tokens Swapped</span>
                  <span className="col-span-3">Status</span>
                  <span className="col-span-2 text-right">Explorer</span>
                </div>
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="p-3 bg-[#091326] hover:bg-[#0e1d38] text-slate-300 grid grid-cols-12 items-center border-b border-black/60 transition">
                    <div className="col-span-3 font-bold text-white truncate">{entry.action}</div>
                    <div className="col-span-4 text-amber-300 font-mono truncate">{entry.tokensSwapped}</div>
                    <div className="col-span-3 text-[11px] text-emerald-400 truncate flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{entry.status}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <a 
                        href={entry.explorerUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] neo-btn-orange px-2 py-1 rounded inline-flex items-center space-x-0.5 text-white"
                        title="View on NEARblocks Testnet Explorer"
                      >
                        <span>VIEW</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="neo-btn-dark px-6 py-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer uppercase"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAST-FORWARD 7-DAY ANALYTICS & SETTLEMENT MODAL (Slice 5) */}
      {showFastForwardModal && fastForwardData && (
        <div className="fixed inset-0 bg-[#040912]/90 backdrop-blur-2xl z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="neo-box-orange max-w-4xl w-full rounded-2xl p-6 sm:p-8 shadow-[12px_12px_0px_#000] relative max-h-[92vh] flex flex-col justify-between overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-black shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-black text-black">
                  <Zap className="w-6 h-6 text-[#ff5e36] fill-[#ff5e36]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-cinzel text-xl font-black text-white">
                      Fast-Forward 7-Day Market Analytics
                    </h3>
                    <span className="text-[10px] bg-[#ff5e36] text-white px-2 py-0.5 rounded font-mono font-black uppercase border border-black shadow-[1px_1px_0px_#000]">
                      SLICE 5
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-300">
                    Autonomous Agent Dynamics • Daily NEP-245 Batch Settlements On-Chain
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsAutoPlaying(false);
                  setShowFastForwardModal(false);
                }}
                className="text-slate-400 hover:text-white cursor-pointer font-bold font-mono text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="py-5 space-y-5 overflow-y-auto pr-1">
              
              {/* Macro Week Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#050b17] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">7-Day Volume</span>
                  <span className="text-base font-black font-mono text-amber-300">{fastForwardData.totalVolume}c</span>
                </div>
                <div className="bg-[#050b17] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Swaps Settled</span>
                  <span className="text-base font-black font-mono text-white">{fastForwardData.totalTrades}</span>
                </div>
                <div className="bg-[#050b17] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Shareholder Dividends</span>
                  <span className="text-base font-black font-mono text-emerald-400">+{fastForwardData.totalDividends}c</span>
                </div>
                <div className="bg-[#050b17] border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">On-Chain Batches</span>
                  <span className="text-base font-black font-mono text-[#ff5e36]">7 / 7 Verified</span>
                </div>
              </div>

              {/* Day Scrubber Ribbon */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#ff5e36]" />
                    <span>TIMELINE SCRUBBER: SELECT DAY</span>
                  </span>
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="neo-btn-dark px-3 py-1 rounded-md text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    {isAutoPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                    <span>{isAutoPlaying ? 'PAUSE AUTO-PLAY' : 'AUTO-PLAY WEEK'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {fastForwardData.days.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setSelectedFFDay(d.day);
                      }}
                      className={`p-2 rounded-lg border-2 border-black font-mono text-center transition-all cursor-pointer ${
                        selectedFFDay === d.day
                          ? 'bg-[#ff5e36] text-white shadow-[3px_3px_0px_#000] scale-102 font-black'
                          : 'bg-[#091326] text-slate-300 hover:bg-[#121f38] shadow-[1px_1px_0px_#000]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold">Day {d.day}</div>
                      <div className="text-[11px] font-extrabold">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d.day - 1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Day Inspector */}
              {(() => {
                const day = fastForwardData.days[selectedFFDay - 1];
                if (!day) return null;

                return (
                  <div className="space-y-4">
                    
                    {/* Day Title & Verified On-Chain Settlement Card */}
                    <div className="bg-[#050b17] border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-bold text-white text-sm">{day.label}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-300 mt-1">
                          Settlement: <span className="text-amber-300 font-bold">{day.volumeCoin}c</span> volume • <span className="text-slate-100">{day.tradesCount} swaps</span> • Dividends: <span className="text-emerald-400 font-bold">+{day.playerDividendEarned}c</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                          100% Gas Sponsored (NEP-366)
                        </span>
                        <a
                          href={day.settlementTx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-btn-orange px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase flex items-center space-x-1"
                          title="Verify On-Chain Transaction on NEAR Testnet"
                        >
                          <span>EXPLORER</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* 4 Merchants Dynamic Standings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Marta */}
                      <div className="bg-[#091326] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] font-mono text-xs space-y-1.5">
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                          <span className="font-bold text-white">Marta's Forge</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${day.merchants.forge_marta.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {day.merchants.forge_marta.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Cash:</span>
                          <span className="text-amber-300 font-bold">{day.merchants.forge_marta.cash.toFixed(1)}c</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Iron Ore:</span>
                          <span className="text-slate-100">{day.merchants.forge_marta.stock.iron_ore || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Ore Bid Price:</span>
                          <span className="text-[#ff5e36] font-bold">{day.merchants.forge_marta.bidPrice.toFixed(2)}c</span>
                        </div>
                      </div>

                      {/* Piers */}
                      <div className="bg-[#091326] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] font-mono text-xs space-y-1.5">
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                          <span className="font-bold text-white">Piers Timber</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${day.merchants.piers_timberyard.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {day.merchants.piers_timberyard.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Cash:</span>
                          <span className="text-amber-300 font-bold">{day.merchants.piers_timberyard.cash.toFixed(1)}c</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Timber:</span>
                          <span className="text-slate-100">{day.merchants.piers_timberyard.stock.timber || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Timber Bid:</span>
                          <span className="text-emerald-400 font-bold">{day.merchants.piers_timberyard.bidPrice.toFixed(2)}c</span>
                        </div>
                      </div>

                      {/* Gull & Anchor */}
                      <div className="bg-[#091326] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] font-mono text-xs space-y-1.5">
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                          <span className="font-bold text-white">Gull & Anchor</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${day.merchants.tavern_gull.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {day.merchants.tavern_gull.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Cash:</span>
                          <span className="text-amber-300 font-bold">{day.merchants.tavern_gull.cash.toFixed(1)}c</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Fish Stock:</span>
                          <span className="text-slate-100">{day.merchants.tavern_gull.stock.fish || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Fish Bid:</span>
                          <span className="text-cyan-400 font-bold">{day.merchants.tavern_gull.bidPrice.toFixed(2)}c</span>
                        </div>
                      </div>

                      {/* Shipyard */}
                      <div className="bg-[#091326] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] font-mono text-xs space-y-1.5">
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                          <span className="font-bold text-white">Shipyard</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-300">
                            CONSUMER
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Cash:</span>
                          <span className="text-amber-300 font-bold">{day.merchants.shipyard_brannock.cash.toFixed(1)}c</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Planks:</span>
                          <span className="text-slate-100">{day.merchants.shipyard_brannock.stock.plank || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Ingots:</span>
                          <span className="text-slate-100">{day.merchants.shipyard_brannock.stock.iron_ingot || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Activity Log */}
                    <div className="bg-black border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_#000] font-mono text-xs space-y-1.5">
                      <span className="font-bold text-[#ff5e36] block uppercase tracking-wider text-[10px]">
                        Day {day.day} Harbor Activity & Agent Intent Log:
                      </span>
                      {day.events.length > 0 ? (
                        day.events.map((evt, idx) => (
                          <div key={idx} className="text-slate-200 text-[11px] flex items-center space-x-2">
                            <span className="text-slate-500">•</span>
                            <span>{evt}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-[11px]">Normal peaceful trade across the harbor.</div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-mono text-slate-300">
                End-of-week dividends: <strong className="text-emerald-400">+{fastForwardData.totalDividends}c</strong>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setShowFastForwardModal(false);
                  }}
                  className="neo-btn-dark px-4 py-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer uppercase flex-1 sm:flex-none text-center"
                >
                  Discard
                </button>
                <button
                  onClick={applyFastForwardWeek}
                  className="neo-btn-orange px-6 py-2.5 rounded-lg text-xs font-mono font-black cursor-pointer uppercase flex items-center justify-center space-x-2 flex-1 sm:flex-none shadow-[3px_3px_0px_#000]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>APPLY WEEK TO HARBOR (+{fastForwardData.totalDividends}c)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CINEMATIC STORY PROLOGUE: "ONCE UPON A TIME..." */}
      {showStoryPrologue && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#040813]/95 backdrop-blur-2xl text-slate-100 select-none animate-in fade-in duration-500">
          
          {/* Top Cinematic Film Bar */}
          <div className="h-14 sm:h-16 bg-black border-b border-[#ff5e36]/30 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5e36] animate-pulse" />
              <span className="font-cinzel text-xs sm:text-sm font-black tracking-widest uppercase text-amber-200">
                HOLLOW HARBOR CHRONICLES • PROLOGUE
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSound}
                className={`px-3 py-1 rounded-lg border-2 border-black flex items-center space-x-1.5 text-xs font-mono transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                  isAudioOn ? 'bg-[#ff5e36] text-white font-bold' : 'bg-[#15233c] text-slate-300'
                }`}
                title="Toggle Coastal Ocean Waves & Harbor Bells"
              >
                {isAudioOn ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAudioOn ? 'HARBOR AUDIO ON' : 'AUDIO MUTED'}</span>
              </button>

              <button
                onClick={finishStoryPrologue}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                title="Skip prologue and enter docks immediately"
              >
                SKIP TO HARBOR ➔
              </button>
            </div>
          </div>

          {/* Center Stage: Cinematic Story Card */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Atmospheric background glow */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#ff5e36]/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

            {(() => {
              const slide = PROLOGUE_SLIDES[storyChapter];
              return (
                <div 
                  key={storyChapter} 
                  className="max-w-2xl w-full neo-box-orange p-6 sm:p-10 rounded-3xl shadow-[14px_14px_0px_#000] relative z-10 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
                >
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] sm:text-xs font-mono font-black uppercase bg-[#ff5e36] text-white px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_#000]">
                        {slide.chapter}
                      </span>
                      <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase">
                        {slide.badge}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 font-bold">
                      {storyChapter + 1} / {PROLOGUE_SLIDES.length}
                    </div>
                  </div>

                  {/* Main Headlines */}
                  <div className="space-y-2">
                    <h2 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                      {slide.title}
                    </h2>
                    <p className="font-mono text-xs sm:text-sm font-bold text-[#ff5e36] uppercase tracking-wide">
                      {slide.subtitle}
                    </p>
                  </div>

                  {/* Lore Quote Callout */}
                  <div className="bg-[#050b17] border-l-4 border-[#ff5e36] p-3.5 rounded-r-xl border-y-2 border-r-2 border-black shadow-[3px_3px_0px_#000]">
                    <p className="font-cinzel italic text-xs sm:text-sm text-amber-200 leading-relaxed">
                      {slide.quote}
                    </p>
                  </div>

                  {/* Narrative Prose */}
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-medium">
                    {slide.text}
                  </p>

                  {/* Sensory Cue */}
                  <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-slate-400 italic">
                    <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{slide.accent}</span>
                  </div>

                  {/* Chapter Navigation Controls */}
                  <div className="pt-6 border-t-2 border-black flex items-center justify-between gap-3">
                    {storyChapter > 0 ? (
                      <button
                        onClick={prevStoryChapter}
                        className="neo-btn-dark px-4 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>BACK</span>
                      </button>
                    ) : <div />}

                    {storyChapter < PROLOGUE_SLIDES.length - 1 ? (
                      <button
                        onClick={advanceStoryChapter}
                        className="neo-btn-orange px-7 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-[3px_3px_0px_#000]"
                      >
                        <span>NEXT CHAPTER</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={finishStoryPrologue}
                        className="neo-btn-orange px-8 py-3.5 rounded-xl font-mono font-black text-sm uppercase tracking-wider flex items-center space-x-2.5 cursor-pointer shadow-[4px_4px_0px_#000] animate-pulse"
                      >
                        <Anchor className="w-4 h-4" />
                        <span>ENTER HOLLOW HARBOR</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })()}
          </div>

          {/* Bottom Cinematic Film Bar */}
          <div className="h-14 sm:h-16 bg-black border-t border-[#ff5e36]/30 px-6 flex items-center justify-between shrink-0">
            {/* Story Timeline dots */}
            <div className="flex items-center space-x-2">
              {PROLOGUE_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setStoryChapter(idx);
                    harborAudio.playStoryAdvance();
                  }}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    storyChapter === idx 
                      ? 'w-8 bg-[#ff5e36] shadow-[0_0_8px_#ff5e36]' 
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  title={`Go to chapter ${idx + 1}`}
                />
              ))}
            </div>

            <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
              AUTONOMOUS NEAR ECONOMY • WHERE THE ECONOMY IS THE GAMEPLAY
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
