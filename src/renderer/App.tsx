import { useEffect, useMemo, useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { AppTopbar, SidebarNav, ToastNotice } from './components/AppLayoutParts'
import { useAudioDeviceSettings } from './hooks/useAudioDeviceSettings'
import { useAudioTranscription } from './hooks/useAudioTranscription'
import { useAnswerGeneration } from './hooks/useAnswerGeneration'
import { useHealthCheck } from './hooks/useHealthCheck'
import { useInterviewSessionActions } from './hooks/useInterviewSessionActions'
import { useInterviewSimulation } from './hooks/useInterviewSimulation'
import { useResumeProfiles } from './hooks/useResumeProfiles'
import { useRoleJdGeneration } from './hooks/useRoleJdGeneration'
import { useSessions } from './hooks/useSessions'
import { useSettingsBackup } from './hooks/useSettingsBackup'
import { useSyncedRef } from './hooks/useSyncedRef'
import { useTrainingSession } from './hooks/useTrainingSession'
import { useTranscriptRouting } from './hooks/useTranscriptRouting'
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys'
import { useInterviewWarmup } from './hooks/useInterviewWarmup'
import { filterWorkspaceTranscript } from './lib/transcriptFilter'
import { speechProviderNames } from '../shared/speechProviders'
import { useSettingsStore } from './stores/useSettingsStore'
import { useUIStore } from './stores/useUIStore'
import {
  createSession,
  providerNames,
  type ViewId
} from './lib/appHelpers'
import { buildReview } from './lib/sessionExport'
import { appendSpokenAnswer, stripTrainingAnswerCompletionCue } from './lib/trainingAnswerCompletion'
import { HealthCheckView } from './views/HealthCheckView'
import { HelpCenterView } from './views/HelpCenterView'
import { InterviewReviewView } from './views/InterviewReviewView'
import { RealisticInterviewView } from './views/RealisticInterviewView'
import { ResumeView } from './views/ResumeView'
import { SettingsView } from './views/SettingsView'
import { SessionsView } from './views/SessionsView'
import { TrainingView } from './views/TrainingView'
import { WorkspaceView } from './views/WorkspaceView'
import { UpdateExperience } from './components/UpdateExperience'
import type { AppSettings, InterviewSession, TrainingPreset, WarmupQuestionCount, UsageStats, ProviderId, ProviderTestResult } from '../shared/types'

// Wrapper: 闂?store 闂?setUsageStats 闂傚倸鍊搁崐鎼佸磹閻戣姤鍤勯柛顐ｆ磵閳ь剨绠撳畷濂稿閳ュ啿绨ラ梻浣告贡閸庛倝銆冮崨鏉戠＜闁靛ě鍕瀾闂佸搫鍟悧鍕焵?Dispatch 缂傚倸鍊搁崐鎼佸磹閹间礁纾瑰瀣椤愪粙鏌ㄩ悢鍝勑㈢痪鎹愵嚙椤潡鎳滈棃娑樞曢梺杞扮椤戝洭骞夐幖浣哥睄闁割偅绻勯悾?
function useStoreSetUsageStats(): Dispatch<SetStateAction<UsageStats>> {
  return useCallback((value: UsageStats | ((prev: UsageStats) => UsageStats)) => {
    if (typeof value === 'function') {
      const prev = useSettingsStore.getState().usageStats
      useSettingsStore.getState().setUsageStats((value as (prev: UsageStats) => UsageStats)(prev))
    } else {
      useSettingsStore.getState().setUsageStats(value)
    }
  }, [])
}

export function App(): JSX.Element {
  // --- Zustand stores ---
  const activeView = useUIStore((s) => s.activeView)
  const setActiveView = useUIStore((s) => s.setActiveView)
  const showToast = useUIStore((s) => s.showToast)
  const toast = useUIStore((s) => s.toast)
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const isScrollActive = useUIStore((s) => s.isScrollActive)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  const settings = useSettingsStore((s) => s.settings)
  const usageStats = useSettingsStore((s) => s.usageStats)
  const providerTests = useSettingsStore((s) => s.providerTests)
  const testingProvider = useSettingsStore((s) => s.testingProvider)
  const setUsageStats = useStoreSetUsageStats()
  const updateAnswer = useSettingsStore((s) => s.updateAnswer)
  const updateSpeech = useSettingsStore((s) => s.updateSpeech)
  const setProviderTests = useCallback((value: Partial<Record<ProviderId, ProviderTestResult>> | ((prev: Partial<Record<ProviderId, ProviderTestResult>>) => Partial<Record<ProviderId, ProviderTestResult>>)) => {
    if (typeof value === 'function') {
      const prev = useSettingsStore.getState().providerTests
      useSettingsStore.getState().setProviderTests((value as (prev: Partial<Record<ProviderId, ProviderTestResult>>) => Partial<Record<ProviderId, ProviderTestResult>>)(prev))
    } else {
      useSettingsStore.getState().setProviderTests(value)
    }
  }, [])

  // --- 闂傚倸鍊搁崐鎼佸磹妞嬪海鐭嗗〒姘ｅ亾妤犵偞鐗犻、鏇㈡晜閽樺缃曟繝鐢靛Т閿曘倝鎮ч崱娆戠焼闁割偆鍠撶粻楣冩煕閳╁喚娈滈柣娑欑矒閺屻倝寮堕幐搴′淮闂佸搫鐬奸崰鎾舵閹烘顫呴柣妯虹－娴滃爼姊绘担渚劸妞ゆ垵妫濆畷婵嗏枎閹惧疇鎽曢梺闈涚墕椤︻垱瀵奸悩缁樼厪濠㈣埖锚閺嬬喐鎱ㄩ敐鍛劯婵﹨娅ｇ划娆忊枎閹冨闂備浇顫夐悺鏇炵暦閻㈤潧鍨濇い鎾卞灪閸嬪嫰鏌涘┑鍕姢闁伙箑鐗撳娲川婵犲啫顦╅梺鍛婄懃妤犵宓勯梻渚囧墮缁夌敻鍩涢幋锔界厱婵犻潧妫楅瀛樹繆閸欏灏﹂柡宀嬬節瀹曘劑顢欓崜褏鍘旈梻浣告贡閻℃棃宕戦崟顖氱厴闁硅揪闄勯崑鎰亜閹板灚绶氬瑙勬礃娣囧﹪鎮欓鍕ㄥ亾閺嶎厼绠板Δ锝呭暙缁愭鏌熼柇锕€骞樻い鈺傜叀閺屾洟宕煎┑鍥т痪閻熸粎澧楃敮妤呭疾閺屻儲鐓曢柕澶涚到婵″潡鏌ㄥ☉姗堣含婵﹥妞藉畷姗€宕ｆ径瀣壍闂備胶鎳撻崯鍨规搴″灊?store闂?---
  const [session, setSession] = useState<InterviewSession>(() => createSession())
  const [isSimulating, setIsSimulating] = useState(false)
  const [autoAnswer, setAutoAnswer] = useState(false)
  const [isTranscriptPaused, setIsTranscriptPaused] = useState(false)
  const [pausedTranscriptCount, setPausedTranscriptCount] = useState(0)
  const [warmupQuestionCount, setWarmupQuestionCount] = useState<WarmupQuestionCount>(30)
  const trainingAnswerBufferRef = useRef('')
  const trainingAnswerActionsRef = useRef({
    appendTranscript: (_text: string) => {},
    finishAnswer: (_text?: string) => {}
  })

  const settingsRef = useSyncedRef(settings)
  const sessionRef = useSyncedRef(session)
  const autoAnswerRef = useSyncedRef(autoAnswer)
  const latestTranscript = useMemo(() => session.transcript.slice(-5), [session.transcript])

  // --- 闂傚倸鍊搁崐鎼佸磹妞嬪海鐭嗗〒姘ｅ亾妤犵偛顦甸弫宥夊礋椤掍焦顔囨繝寰锋澘鈧洟宕姘辨殾闁哄被鍎查悡鏇犫偓鍏夊亾闁逞屽墴瀹曟洟骞嬮悩鐢殿槸闂佸搫绋侀崢浠嬫偂濞嗘挻鐓熸俊銈傚亾闁绘锕﹀▎銏ゆ嚑椤掑倻锛滈梺閫炲苯澧柣锝嗙箞瀹曠喖顢楅崒姘闂佽楠哥粻宥夊磿閸楃伝娲晝閸屾碍杈堥梺鍐叉惈閸熸壆澹曟總鍛婄厵闂侇叏绠戝鐐箾閸喓鐭掗柡宀嬬磿娴狅箓宕滆閸掓盯鎮楀▓鍨珮闁革綇绲介悾鐑藉箳閹宠埖甯掗埢搴ㄥ箚瑜嶉～顏嗙磽娴ｈ櫣甯涢柣鈺婂灠椤曪綁宕奸弴鐐殿吅闂佺粯鍔樼亸娆撴偘閳哄懏鈷掑ù锝囧劋閸も偓闂佹悶鍨洪悡锟犮€侀弽銊ョ窞濠电姴瀚▓鎯р攽閻樿宸ユ俊顐幖鍗卞Δ锝呭暞閳锋垿鏌涘┑鍡楊伌闁稿骸绻橀弻娑欑節閸屾稑浠撮悗娈垮枦椤曆囧煡婢跺娼ㄩ柛鈩冪懃瀵娊姊绘担鍛婂暈闁告棑闄勭粋宥夋倷閺夋埈鍤ら梺鎼炲労閸撴岸鍩涢幋锕€绾ч柣鎰緲瀹撳棙淇婇崜褍鍘撮柡灞剧⊕缁绘繈宕橀鍡欐澖闁?---
  useEffect(() => {
    useSettingsStore.getState().loadAll()
  }, [])

  // --- Toast 闂傚倸鍊搁崐鎼佸磹閻戣姤鍤勯柛顐ｆ礀閸屻劎鎲搁弮鍫澪ラ柛鎰ㄦ櫆閸庣喖鏌曡箛瀣労婵炶尙顭堥埞鎴︽偐鐠囇冧紣闁诲孩鍑归崣鍐ㄧ暦閿濆牏鐤€婵炴垶鐟ч崢鎾绘煛婢跺苯浠﹀┑顖欑矙椤㈡瑦寰勭€ｂ晝绠氶梺鍦帛鐢偞鏅堕敃鍌涚厸閻忕偛澧藉ú瀛樸亜閵忊剝绀嬮柡浣瑰姍瀹曞爼鍩￠崘顏嗗炊濠电姷鏁搁崑娑㈡偤閵娧冨灊鐎光偓閸曨倠褔鏌熼梻瀵割槮闁藉啰鍠栭弻鏇熺箾閸喖濮夊┑鈩冨絻閻楀﹥绌辨繝鍥舵晬婵犲﹤鍟禒妯侯渻閵堝繒鍒版繝鈧潏鈺傤潟?store 濠电姷鏁告慨鐑姐€傞鐐潟闁哄洢鍨圭壕濠氭煟閺冨倸甯剁紒鐘靛█閺岀喖骞嗚閿涘秹鏌￠崱顓㈡闁靛洤瀚伴獮鎺戭吋閸パ冾瀴闂備礁鎲￠悷銉ф崲濮椻偓瀵顓兼径濠佺炊闂佸憡娲﹂崜娆忊枍閵堝鈷?---
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => useUIStore.getState().dismissToast(), toast.kind === 'error' ? 5200 : 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const openDiagnosticsFromToast = useCallback(() => {
    setActiveView('checkup')
    useUIStore.getState().dismissToast()
    window.setTimeout(() => {
      document.querySelector('.diagnostic-log-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [setActiveView])

  // --- 婵犵數濮烽弫鍛婃叏閻戣棄鏋侀柛娑橈攻閸欏繘鏌熺紒銏犳灍闁哄懏绻堥弻鏇熷緞閸℃ɑ鐝曢梺鎼炲€曢惌鍌炲蓟閿濆绠涢梻鍫熺☉椤亪姊洪崨濠勬噧缂佺粯锕㈠璇差吋閸℃ê顫￠梺瑙勵問閸犳牠顢氶崡鐐╂斀闁绘劖娼欓悘鐔兼煕閵娿儳绉洪柟顔惧仱瀹曞綊顢曢悩杈╃泿闂備胶鎳撻幖顐⑽涘Δ浣侯洸濡わ絽鍟埛鎺楁煕閵夋垵鏈埢鍫ユ⒑鐠団€虫灍妞ゃ劌锕顐﹀箛閺夊灝绐涘銈嗘寙閸曨剦鍟堢紓鍌氬€搁崐椋庢媼閺屻儱纾婚柟鍓х帛閻撴洟鏌￠崶銉ュ闁?store 濠电姷鏁告慨鐑姐€傞鐐潟闁哄洢鍨圭壕濠氭煟閺冨倸甯剁紒鐘靛█閺岀喖骞嗚閿涘秹鏌￠崱顓㈡闁靛洤瀚伴獮鎺戭吋閸パ冾瀴闂備礁鎲￠悷銉ф崲濮椻偓瀵顓兼径濠佺炊闂佸憡娲﹂崜娆忊枍閵堝鈷?---
  useEffect(() => {
    let timer = 0
    const markScrolling = () => {
      useUIStore.getState().setScrollActive(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => useUIStore.getState().setScrollActive(false), 1000)
    }
    window.addEventListener('scroll', markScrolling, true)
    window.addEventListener('wheel', markScrolling, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', markScrolling, true)
      window.removeEventListener('wheel', markScrolling)
    }
  }, [])

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁哄懏绻堥弻鏇熷緞濞戞﹩娲紓浣哄У閸庢娊鍩為幋锔藉亹闁告瑥顦崑宥夋⒑闁偛鑻晶顕€鏌涙繝鍌滀虎闁伙絽鍢查…銊╁礋椤掆偓椤庢捇姊洪懡銈呮灈闁稿锕崺鈧い鎺嶈兌濞插瓨鎱ㄦ繝鍛仩闁归濞€閸ㄦ儳鐣烽崶锝呬壕濠电姵纰嶉崐鍫曟煟閹邦厽缍戦柣?---
  const {
    audioDeviceError,
    audioInputDevices,
    desktopAudioSources,
    isRefreshingAudioDevices,
    isRefreshingDesktopSources,
    isRunningMicrophoneDiagnostic,
    microphonePermission,
    microphoneDiagnostic,
    refreshAudioDevices,
    refreshDesktopAudioSources,
    resetAudioUiState,
    runMicrophoneDiagnostic,
    selectedMicrophoneDeviceId,
    selectedMicrophoneLabel,
    selectedSystemSourceId,
    selectedSystemSourceName,
    setSelectedMicrophoneDeviceId,
    setSelectedSystemSourceId,
    systemAudioSupported
  } = useAudioDeviceSettings({ showToast })

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁稿顑夐弻娑㈠即閵娿儳浠╅梺鎼炲妼閸婃悂鍩為幋锕€纾兼慨姗嗗幖閺嗗牓姊虹粙鍧楊€楅柨鏇樺劦婵＄敻宕熼姘敤闂侀潧顭堥崕閬嶅几濞嗘垹纾藉ù锝囨嚀閺佸墽绱撳鍕獢鐎殿喛顕ч埥澶愬閻樻彃绁梻渚€娼ч…鍫ュ磿鏉堚晝涓嶇憸鐗堝笚閳锋垿鏌涘☉姗堟敾闁抽攱鍔曢…鍧楁偡閻楀牜妫ゅ┑鈥冲级閸旀瑩鐛Ο鍏煎珰闁肩⒈鍓ㄧ槐鍙夌節閻㈤潧浠﹂柛銊ョ埣閹兘濡疯閺嬪牏鈧箍鍎遍ˇ浼村煕?---
  const {
    state: warmupState,
    startWarmup,
    pauseWarmup,
    clearCache: clearWarmupCache,
    checkCache: checkCachedAnswer
  } = useInterviewWarmup({ settings })

  // --- 缂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸婂潡鏌ㄩ弬鍨挃闁活厽鐟╅弻鐔兼倻濡櫣鍔稿┑鐐插悑閻楁粓骞夐幖浣瑰亱闁割偅绻勯濠氭⒑闁偛鑻崢鍝ョ磼閳ь剚绗熼埀顒勩€佸鈧畷妤呮偂鎼达絿鐛梺璇插嚱缂嶅棙绂嶅▎鎴犵＝闁瑰墽绮埛鎺懨归敐鍫燁仩閻㈩垱绋掗幈銊︾節閸屻倗鍚嬮梺鐐藉劵缁犳挸鐣锋總绋课ㄩ柨鏇楀亾闁逞屽墮閻栧ジ寮诲☉銏犖ㄦい鏃傚帶椤亪姊虹紒妯诲蔼闁稿氦灏欓幑銏犫槈閵忕姷顓洪梺缁樺灥濡盯宕濋柨瀣瘈闁冲皝鍋撻柛鏇ㄥ墰椤︿即姊洪崫鍕拱缂佸鍨奸悘鎺楁⒑閻撳寒娼熼柛濠冨姈閹便劑宕堕埡鍐紳婵炶揪绲块…鍫ュ焵椤掆偓閹芥粎鍒掗弮鍫熷仺缂佸娉曢悾楣冩⒑閸濆嫬鏆欓柣妤€妫欓崕顐︽煟閻斿摜鐭婄紒澶嬫尦椤㈡岸濡烽埡浣侯啋缂傚倸鐗忔慨椋庣不濮橆剦娓婚柕鍫濇婵倿鏌涙繝鍐╃闁靛棗鍊圭缓浠嬪川婵犲嫬骞堥梻渚€娼ц噹闁告劑鍔嬬划顖炴⒒閸屾碍鎼愭い锔炬暬瀵鈽夐姀鐘靛姶闂佸憡鍔︽禍鏍ｉ崼銏㈢＝濞达絾褰冩禍楣冩⒑閸涘﹤濮€闁哄懏绻勭划缁樸偅閸愨晝鍘遍梺鏂ユ櫅閸犳岸鎮炴禒瀣厵闁告劕寮堕崳鐣岀磼鏉堛劌娴柛鈹惧亾濡炪倖甯婄粈浣烘閻愮儤鐓欓梺顓ㄧ畱楠炴﹢鏌涘鈧禍璺侯潖濞差亝顥堟繛鎴濈－绾偓闂備礁鎲￠崝鏇㈠窗濞戞碍宕叉繝闈涱儏缁犳牜鎲搁悧鍫濈瑨缂佺姵绋掗妵鍕棘閸喗鍊梺璇插閸庢娊鍩為幋锔藉€风痪鐗埳戠€氭稒绻涚€涙鐭ゅù婊庝邯婵″瓨鎷呴懖婵囨瀹曘劑顢橀悩鎻捫曞┑锛勫亼閸婃牜鏁幒鏂哄亾濮樼厧澧撮柟顔兼健椤㈡岸鍩€椤掑嫬钃熼柣鏃傚帶缁犳氨鎲稿鍫濆惞闁绘柨鍚嬮悡鐔兼煟閺冣偓濡炲灝顭囬幇顔剧＜缂備焦顭囩粻鐐翠繆椤愩垹鏆欓柍钘夘樀瀹曟﹢骞撻幒婵囨祮婵犵绱曢崑鎴﹀磹閹版澘鐤鹃柍鍝勬噹绾捐鈹戦悩鍙夋悙缂佺姵鐗楁穱濠囧Χ閸涱喖娅ら梺绋款儜缁绘繈寮婚埄鍐ㄧ窞閻庯綆浜堕崵瀣攽閻愯尙澧ｆ繛澶嬬洴閸╃偤骞嬮敂钘夆偓鐑芥煠绾板崬澧い銈傚亾闂傚倷鐒﹂幃鍫曞礉瀹€鍕€舵繝闈涱儐閸嬧晠鏌ｉ幋锝嗩棄闂佸崬娲弻锟犲炊閳轰焦鐎婚梺閫炲苯澧伴柛蹇旓耿瀵鈽夐姀鐘殿啋闂佽偐鈷堥崜娆愪繆閽樺娓婚柕鍫濇閻撱儳绱掓径灞惧殌妞?---
  const {
    question,
    setQuestion,
    prepared,
    completed,
    isGenerating,
    streamingText,
    queuedCount,
    queuedAnswers,
    generateAnswerFrom,
    generateAnswer,
    resetAnswerState,
    startNewSession,
    exportCurrentReview,
    latencyReport,
    openFloatingWindow,
    questionRewriteNotice,
    questionIntentNotice,
    contextCompressionNotice
  } = useAnswerGeneration({
    checkCachedAnswer,
    settings,
    currentSessionRef: sessionRef,
    setCurrentSession: setSession,
    setUsageStats,
    showToast
  })

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁稿顑夐弻娑㈠即閵娿儳浠╅梺鎼炲妼閸婃悂鍩為幋锕€纾兼慨姗嗗幖閺嗗牓姊虹粙鍧楊€楅柨鏇樺劦婵＄敻宕熼姘敤濡炪倖鍔﹀鈧紒顔煎缁辨挻鎷呴崫鍕戭剟鏌涚€ｎ偄濮嶉柛鈹惧亾濡炪倖宸婚崑鎾剁磼閻樿尙效鐎规洘娲樺蹇涘煘閹傚濠殿喗顭囬崢褔寮搁妶鍥╃＜妞ゆ梻鏅幊鍕磼缂佹绠炵€规洖鐖兼俊姝岊槻鐎殿喛娅曠换婵嬫偨闂堟稐娌梺鎼炲妽閸庡ジ骞楅銈囩＝闁稿本姘ㄥ皬闂備緡鍣幗顢簉anscriptLine闂傚倸鍊搁崐鎼佸磹妞嬪孩顐芥慨姗嗗墻閻掔晫鎲稿鍫罕闂備礁鎼崯鐘诲磻閹惧灈鍋撻崹顐ｇ凡閻庢矮鍗抽獮鍐倷绾版ê浜鹃柛蹇旂摃閸氱嵉urrentSession闂?---
  const {
    addManualQuestion,
    addTranscriptLine,
    saveCurrentSession
  } = useInterviewSessionActions({
    autoAnswerRef,
    currentSessionRef: sessionRef,
    generateAnswerFrom,
    question,
    saveSessionSnapshot: async (s) => {
      // Will be provided below
      return []
    },
    setCurrentSession: setSession,
    setQuestion,
    settingsRef,
    showToast
  })

  const onMissingDeepgramKey = useCallback(() => {
    showToast('闂傚倸鍊搁崐宄懊归崶褏鏆﹂柛顭戝亝閸欏繘鏌℃径瀣婵炲樊浜滃洿婵犮垼娉涢敃銈囪姳閵夆晜鈷戦柛婵嗗椤箓鏌涙惔銊ゆ喚鐎规洘甯℃俊鎼佹晜閸撗屽晭闂備胶鎳撻悺銊╂偡閵夆晜鍊堕柍鍝勬噺閻撴瑩鏌ｉ悢绋款棆闁糕晪缍侀弻锛勪沪閻愵剛顦ㄧ紓浣虹帛缁诲啴骞嗛弮鍫熸櫜闁告侗鍘肩槐顒勬⒒閸屾瑧顦﹂柟鑺ョ矒瀹曠増鎯旈埈鎯邦潐椤︾増鎯旈姀鈺傜稐闂備浇顫夊畷姗€顢氳缁牓宕橀鐣屽幍濡炪倖鐗曞Λ妤冣偓姘煎枟缁傚秹鎮欓悜妯锋嫽婵炶揪绲介幖顐ゆ暜閸洘鐓熼煫鍥ㄦ煥閸濊櫣鈧娲栫紞濠傜暦缁嬭鏃堝焵椤掑嫭瀚呴柣鏂跨殱閺€浠嬫煟濡绲诲ù婊呭仱閺屾稑顫濋澶婂壎闂佸搫鏈惄顖涗繆閻戣棄顫呴柍鈺佸暟瑜板棝姊?Deepgram API Key', 'error')
  }, [showToast])

  const handleWorkspaceTranscript = useCallback((text: string) => {
    if (isTranscriptPaused) {
      setPausedTranscriptCount((count) => count + 1)
      return
    }

    const filtered = filterWorkspaceTranscript(text)

    if (!filtered.accepted) {
      console.info(`[transcript] filtered ${filtered.reason || 'invalid'}: ${text}`)
      return
    }

    const currentSession = sessionRef.current
    const line = { id: crypto.randomUUID(), speaker: 'interviewer' as const, text: filtered.text, at: Date.now(), isFinal: true }
    const nextTranscript = [...currentSession.transcript, line]

    setSession((prev) => ({ ...prev, transcript: [...prev.transcript, line] }))

    if (autoAnswerRef.current) {
      void generateAnswerFrom(filtered.text, nextTranscript)
    }
  }, [autoAnswerRef, generateAnswerFrom, isTranscriptPaused, sessionRef, setSession])

  const handleTrainingAnswerTranscript = useCallback((text: string) => {
    trainingAnswerActionsRef.current.appendTranscript(text)
  }, [])

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁哄懏绻堥弻鏇熷緞濞戞﹩娲紓浣哄У閸庢娊鍩為幋锔藉亹闁告瑥顦崑宥夋⒑闁偛鑻晶顕€鏌涙繝鍌涘仴妤犵偛锕ら…銊╁醇濠靛棛鈧厼顪冮妶鍡楀闁糕晛瀚…鍥敍濞戞绠氶梺缁樺姦娴滄粓鍩€椤掍胶澧い鏂跨箲缁绘繂顫濋鍌︾幢闂備胶鎳撴晶鐣屽垝椤栫偞鍋傞柡鍥ュ灪閻撶喖鏌￠崒娑橆嚋闁哥喓鍋熼埀顒冾潐濞叉牠鎯岄崒鐐茶摕闁斥晛鍟刊鎾煕濠靛嫬鍓剧憸蹇涘焵椤掑喚娼愭繛鍙夌墵婵″爼宕ㄦ繝浣虹畾闂佺粯鍨兼慨銈夊疾濠婂牊鍋ｉ柟顓熷笒婵¤偐绱掑Δ瀣瘈婵?settings闂傚倸鍊搁崐鎼佸磹妞嬪孩顐芥慨姗嗗墻閻掔晫鎲稿鍫罕闂備礁鎼崯顐﹀磹瑜版帩鏁冮柤鎭掑劜閸欏繑淇婇姘变虎闁绘挻鍔欓弻娑氣偓锝庝簻閳ь剙娼″濠氬Χ婢跺﹣绱堕梺闈涱樈閸犳鈻撻幍顔剧＝濞达絿鎳撻弫鍓х磽瀹ュ嫮绐旂€殿喖顭烽幃銏ゅ川婵犲嫮肖闂備礁鎲￠幐鍡涘川閸滃啰绉慨濠冩そ瀹曨偊濡烽妷锔锯偓缁樹繆閵堝洤校闁诡喖鍊块崹楣冩晜閻愵剙纾梺闈涱煭缁犳垹澹曢鐐粹拺缂備焦锚閻忥附銇勯鐐村枠闁诡噯绻濋獮瀣倷閻㈡鍟庨梻浣瑰缁诲倿骞婅箛娑樼闁规壆澧楅悡銉╂煛閸ャ儱濡洪梺顓у灦閺岋絽鈽夐崡鐐寸亶缂備焦顨堥崰鏍春閳ь剚銇勯幒鎴濐仴闁逞屽厸缁€渚€鍩ユ径濞㈢喎顭ㄩ崨顓熺€婚梺浼欑岛閸撴繈鏁嶉幇顓熷闁告挸寮堕ˉ鈥斥攽閻樺灚鏆╅柛瀣█楠炴捇顢旈崱娆戭槸闂侀€炲苯澧紒缁樼洴楠炴﹢鎼归銉ь攨闂備礁銈哥紓姘仈閸濄儮鍋撴担鍐ㄤ汗闁逞屽墯缁嬫帡鈥﹂崶顒€鍌?transcript 闂傚倸鍊搁崐鎼佸磹閻戣姤鍊块柨鏇炲€哥粻鏍煕椤愶絾绀€缁炬儳娼￠弻鐔煎箚閻楀牜妫勭紒鐐劤椤兘寮婚敐鍛傜喖鎳栭埡浣侯偧闂備胶顭堟鍝ョ矓瑜版帒钃熼柨婵嗩槸濡﹢鏌涢…鎴濇灍闁稿鍨跺?---
  const onTranscriptFinal = useCallback((text: string) => {
    const { routeFinalTranscript } = useTranscriptRoutingStore.getState()
    routeFinalTranscript(text)
  }, [])

  const {
    isListening,
    listeningMode,
    startAudioTranscription,
    stopAudioTranscription,
    interimTranscript,
    transcriptError,
    transcriptionStats,
    connectionStatus,
    inputLevel
  } = useAudioTranscription({
    settings,
    selectedMicrophoneDeviceId,
    audioInputDevices,
    selectedMicrophoneLabel,
    selectedSystemSourceId,
    selectedSystemSourceName,
    onTranscriptFinal,
    onMissingDeepgramKey,
    showToast
  })

  const audioTopbarStatus = useMemo(() => {
    const speechProvider = settings.speech.sttProvider
    const speechConfig =
      speechProvider === 'deepgram'
        ? {
            ...settings.speech.providers.deepgram,
            enabled: settings.speech.providers.deepgram.enabled || settings.providers.deepgram.enabled,
            apiKey: settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
          }
        : settings.speech.providers[speechProvider]
    const speechProviderName = speechProviderNames[speechProvider]

    if (isListening) {
      const source = listeningMode === 'system' ? '电脑音频' : '麦克风'
      return {
        kind: 'live' as const,
        label: `${source}接收中`,
        detail: `${source}正在通过 ${speechProviderName} 实时转写，连接状态：${connectionStatus}。`
      }
    }

    if (!speechConfig.enabled || !speechConfig.apiKey.trim()) {
      return {
        kind: 'warn' as const,
        label: '语音 Key 未配',
        detail: `${speechProviderName} 未启用或 API Key 未填写，实时语音转写不可用。`
      }
    }

    if (microphonePermission === 'denied') {
      return {
        kind: 'error' as const,
        label: '麦克风被拒绝',
        detail: '系统拒绝了麦克风权限，请到 Windows 隐私权限里打开后再试。'
      }
    }

    if (microphonePermission === 'unsupported') {
      return {
        kind: 'error' as const,
        label: '语音不支持',
        detail: '当前环境不支持麦克风设备枚举或录音能力。'
      }
    }

    if (microphonePermission === 'checking') {
      return {
        kind: 'warn' as const,
        label: '麦克风检测中',
        detail: '正在读取系统麦克风权限和设备列表。'
      }
    }

    if (audioInputDevices.length === 0) {
      return {
        kind: 'warn' as const,
        label: '未检测麦克风',
        detail: '暂时没有检测到可用麦克风，可以到面试台语音设置里刷新 / 授权。'
      }
    }

    return {
      kind: 'ok' as const,
      label: `${speechProviderName} 待机`,
      detail: selectedMicrophoneLabel ? `已检测到麦克风：${selectedMicrophoneLabel}` : '已检测到可用麦克风，等待开启转写。'
    }
  }, [
    audioInputDevices.length,
    connectionStatus,
    isListening,
    listeningMode,
    microphonePermission,
    selectedMicrophoneLabel,
    settings.providers.deepgram.apiKey,
    settings.providers.deepgram.enabled,
    settings.speech
  ])

  const modelTopbarStatus = useMemo(() => {
    const activeProvider = settings.answer.llmProvider
    const providerConfig = settings.providers[activeProvider]
    const providerLabel = providerNames[activeProvider]
    const testResult = providerTests[activeProvider]

    if (testingProvider === activeProvider) {
      return {
        kind: 'live' as const,
        label: `${providerLabel} 测试中`,
        detail: `正在测试当前回答模型：${providerLabel}。`
      }
    }

    if (!providerConfig.enabled) {
      return {
        kind: 'error' as const,
        label: `${providerLabel} 未启用`,
        detail: `当前回答模型服务商 ${providerLabel} 未启用，生成答案前需要到设置中心启用。`
      }
    }

    if (!providerConfig.apiKey.trim()) {
      return {
        kind: 'warn' as const,
        label: `${providerLabel} Key 未填`,
        detail: `当前回答模型 ${providerLabel} 没有填写 API Key，真实 AI 回答会失败。`
      }
    }

    if (testResult?.ok) {
      return {
        kind: 'ok' as const,
        label: `${providerLabel} 在线`,
        detail: `${providerLabel} 最近一次连接测试成功，耗时 ${testResult.latencyMs}ms。`
      }
    }

    if (testResult && !testResult.ok) {
      return {
        kind: 'error' as const,
        label: `${providerLabel} 异常`,
        detail: `${providerLabel} 最近一次连接测试失败：${testResult.status || '失败'}，${testResult.message}`
      }
    }

    return {
      kind: 'warn' as const,
      label: `${providerLabel} 未测试`,
      detail: `${providerLabel} 已填写 Key，但还没有完成连接测试；建议先去设置中心测试。`
    }
  }, [providerTests, settings.answer.llmProvider, settings.providers, testingProvider])

  // --- 闂傚倸鍊搁崐椋庣矆娓氣偓楠炴牠顢曚綅閸ヮ剚鐒肩€广儱鎳愰敍鐔兼⒑閸︻厼顣兼繝銏☆焽缁牓宕奸悢铏诡啎闂佺硶鍓濊摫閻忓浚鍙冮弻锝夊Χ鎼粹剝鐝濋梺鍝勭灱閸犳牠鐛幋锕€绠涙い鎺戝€哥敮鍧楁煟鎼淬値娼愭繛鍙夌墵钘濆ù鍏兼綑妗呴梺鍛婃处閸ㄤ即宕橀埀顒勬⒑闂堟丹娑㈠川椤栨艾绗掗梻鍌氬€风粈渚€骞栭鈶芥稑鈽夊▎鎴狀啎闂侀€炲苯澧撮柡宀嬬磿娴狅妇鎷犻幓鎺濈€抽梻浣哥枃濡嫰藝椤栨繄浜介梻浣虹帛閹稿摜鑺遍崼鏇炵煑闁绘垶顭囩弧鈧梺姹囧灲濞佳勭閿曞倹鐓欑紒瀣閸熺偤鏌￠崨鏉跨厫闁诡垱妫冩俊鎼佸Ψ瑜忛弸鈧梻鍌欒兌缁垶銆冮崨瀛樺亱濠电姴鍟崹鏃堟煙缂併垹鏋熼柣鎾存礃缁绘盯骞嬮悜鍥у彆婵帩鍋呭畝鎼佸蓟?useAudioTranscription 濠电姷鏁告慨鐑藉极閹间礁纾婚柣鎰惈閸ㄥ倿鏌涢锝嗙闁藉啰鍠栭弻鏇熺箾閻愵剚鐝﹂梺杞扮鐎氫即寮诲☉妯锋婵炲棙鍔楃粙鍥╃磽娴ｅ搫校闁绘顨嗙粚杈ㄧ節閸ヮ灛褔鏌涘☉鍗炴灈婵炲懌鍊濆娲传閸曨剙顎涢梺鍛婃尵閸犳牠鐛崘顭戞建闁逞屽墴楠炲啫鈻庨幋鐐茬／闂佺儵鏅滅敮妤呭箰閸撗勵潟闁圭儤顨呴悞鍨亜閹烘垵顏╅梺鍗炴处缁绘繈妫冨☉妯绘濡炪値鍋勭粔鐟邦潖閾忚鍠嗛柛鏇ㄥ亞椤︺劑鎮楃憴鍕闁轰胶顭堝嵄闁规壆澧楅崑瀣煕椤愶絿鈼ョ紒銊ヮ煼濮婃椽宕橀崣澶嬪創濡炪倖鍨靛ú顓㈠箖妤ｅ啫鍨傛い鎰靛亝椤旀棃姊虹紒妯哄闁宦板妼閻ｉ浠︾紒銏☆啍闂佺粯鍔曞鍫曞窗濡眹浜滈柕蹇婂墲椤ュ牏鈧娲栧畷顒勶綖濠靛洦缍囬柍鍝勶工閺佸ジ姊婚崒姘偓鎼佸磹閻戣姤鍊块柨鏇炲€哥粻鏍煕椤愶絾绀€缁炬儳娼￠弻鐔煎箚閻楀牜妫勭紒鐐劤椤兘寮婚敐鍛傜喖鎳栭埡浣侯偧闂備胶顭堟鍝ョ矓瑜版帒钃熼柨婵嗩槸濡﹢鏌涢…鎴濇灍闁稿鍨跺?---
  const {
    transcriptTarget,
    setTranscriptTarget,
    routeFinalTranscript
  } = useTranscriptRouting({
    onWorkspaceTranscript: handleWorkspaceTranscript,
    onTrainingAnswerTranscript: handleTrainingAnswerTranscript
  })

  // 鐎涙ü绔存稉?store 瀵洜鏁ゆ禒銉ょ┒ onTranscriptFinal 閼冲€燁問闂傤喖鍩?
  const useTranscriptRoutingStore = { getState: () => ({ routeFinalTranscript }) }

  const handleToggleTranscriptPause = useCallback(() => {
    const next = !isTranscriptPaused
    setIsTranscriptPaused(next)
    if (next) {
      showToast('已暂停接收转写，本轮闲聊不会进入会话。', 'info')
      return
    }

    setPausedTranscriptCount(0)
    showToast('已恢复接收转写。', 'info')
  }, [isTranscriptPaused, showToast])

  const handleStartNewSession = useCallback(() => {
    setIsTranscriptPaused(false)
    setPausedTranscriptCount(0)
    startNewSession()
  }, [startNewSession])

  // --- 濠电姷鏁告慨鐑藉极閹间礁纾婚柣鎰▕閻掕姤绻涢崱妯诲碍閻熸瑱绠撻幃妤呮晲鎼粹€茬敖闂佸磭鎳撶粔鐢垫崲濞戞﹩鍟呮い鏃囧吹閸戝綊姊虹粙鍧楊€楅柨鏇ㄤ邯瀵鏁愭径瀣珳闂佸憡渚楅崹铏閸ャ劎绠鹃柟瀵稿仦鐏忣厾绱掓径濠勭Ш鐎殿喖顭锋俊鎼佸Ψ閵忊槅娼旀繝纰樻閸垳鎷冮敂鐣岊浄濡わ絽鍟埛?---
  const {
    sessions,
    selectedSessionIds,
    openedSession,
    sessionProfileFilter,
    openedRecords,
    filteredSessions,
    setOpenedSession,
    setSessionProfileFilter,
    refreshSessions,
    saveSessionSnapshot,
    replaceSessions,
    exportSessionMarkdown,
    exportSessionWord,
    renameSession,
    toggleSessionSelection,
    exportSelectedSessions,
    deleteSelectedSessions
  } = useSessions({ currentSessionRef: sessionRef, setCurrentSession: setSession, showToast })

  // --- 闂傚倸鍊搁崐宄懊归崶褏鏆﹂柣銏㈩焾缁愭鏌熼幍顔碱暭闁稿绻濋弻銊╁籍閸屾矮澹曢梺鍝勬缁捇寮婚敐澶婃闁圭瀛╅崰鎰版⒑?JD 闂傚倸鍊搁崐鎼佸磹閻戣姤鍊块柨鏇炲€归崕鎴犳喐閻楀牆绗掗柛銊ュ€搁埞鎴︽偐鐎圭姴顥濈紓浣瑰姈椤ㄥ﹪寮婚悢鍏煎亱闁割偆鍠撻崙锟犳⒑?---
  const { generatingRoleJdMode, generateRoleJdWithAi } = useRoleJdGeneration()

  // --- 婵犵數濮烽弫鍛婃叏閻戝鈧倿鎸婃竟鈺嬬秮瀹曘劑寮堕幋婵堚偓顓烆渻閵堝懐绠伴柣妤€妫涚划鍫ュ醇閻旇櫣鐦堥梻鍌氱墛缁嬫挻鏅堕幇鐗堢厱閻庯綆鍋呯亸顓熴亜椤愶絿绠炴い銏★耿閹晠宕橀崣澶屽蒋闂傚倸鍊烽懗鍫曞箠閹捐搴婇柡灞诲労閺佸嫬顭块懜闈涘闁逞屽厸缁€渚€锝炲鍫濈劦妞ゆ帒瀚粻鏍煃閸濆嫭鍣洪柛瀣ㄥ姂閺岋綁濮€閵堝棙閿柣?---
  const trainingSession = useTrainingSession({
    settings,
    setUsageStats,
    saveSessionSnapshot,
    shouldAutoRestoreDraft: activeView === 'training',
    onUpdateAnswer: updateAnswer,
    showToast
  })

  useEffect(() => {
    trainingAnswerBufferRef.current = trainingSession.currentAnswer
  }, [trainingSession.currentAnswer])

  useEffect(() => {
    trainingAnswerActionsRef.current = {
      appendTranscript: (text: string) => {
        const parsed = stripTrainingAnswerCompletionCue(text)

        if (!parsed.text && !parsed.completed) {
          return
        }

        const nextAnswer = parsed.text ? appendSpokenAnswer(trainingAnswerBufferRef.current, parsed.text) : trainingAnswerBufferRef.current
        trainingAnswerBufferRef.current = nextAnswer
        trainingSession.setCurrentAnswer(nextAnswer)

        if (parsed.completed && nextAnswer.trim()) {
          setTranscriptTarget('workspace')
          stopAudioTranscription()
          void trainingSession.submitAnswer(nextAnswer)
        }
      },
      finishAnswer: (answerText?: string) => {
        const nextAnswer = (answerText ?? trainingAnswerBufferRef.current).trim()

        if (!nextAnswer) {
          return
        }

        trainingAnswerBufferRef.current = nextAnswer
        trainingSession.setCurrentAnswer(nextAnswer)
        setTranscriptTarget('workspace')
        stopAudioTranscription()
        void trainingSession.submitAnswer(nextAnswer)
      }
    }
  }, [setTranscriptTarget, stopAudioTranscription, trainingSession.setCurrentAnswer, trainingSession.submitAnswer])

  // --- 缂傚倸鍊搁崐鎼佸磹閹间礁纾归柣鎴ｅГ閸ゅ嫰鏌ょ粙璺ㄤ粵闁告瑥绻戦妵鍕箻閸楃偟浠肩紒鐐劤椤兘寮婚悢鐓庣鐟滃繒鏁☉銏＄厽闁规儳鐡ㄧ粈鍐ㄇ庨崶褝韬い銏＄☉椤劑宕橀妸銉€卞┑锛勫亼閸婃垿宕曢搹顐ｅ弿闁汇垻顭堟闂佸憡娲﹂崹鎵不婵犳碍鍊垫繛鎴烆仾椤忓牆鐒垫い鎺嶇婵秹鏌?---
  const {
    resumeProfiles,
    filteredResumeProfiles,
    resumeImportStatus,
    resumeSaveStatus,
    resumeSearch,
    isImportingResume,
    setResumeSearch,
    updateResume,
    addResumeProfile,
    selectResumeProfile,
    deleteResumeProfile,
    saveResume,
    importResume,
    removeOtherResume
  } = useResumeProfiles({
    onDeletedProfile: (id) => {
      if (sessionProfileFilter === id) {
        setSessionProfileFilter('all')
      }
    }
  })

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁稿顑夐弻娑㈠即閵娿儳浠╅梺鎼炲妼閸婃悂鍩為幋锕€纾兼慨姗嗗幖閺嗗牓姊虹粙鍧楊€楅柨鏇樺劦婵＄敻宕熼姘敤濡炪値鍘介崹闈涒枔婵傚憡鈷戠紓浣股戦埛鎺楁煕濡姴娲﹂崐鎸庣箾瀹割喕绨奸柣鎾存礋閺岀喖骞嶉搹顐ｇ彅婵犲痉銈嗙《闁?---
  useInterviewSimulation({
    isSimulating,
    onTranscriptLine: addTranscriptLine
  })

  // --- 闂傚倸鍊搁崐鎼佸磹閹间礁纾归柟闂寸绾惧綊鏌熼梻瀵稿妽闁稿顑夐弻娑㈠即閵娿儳浠╅梺鎼炲妼閸婃悂鍩為幋锕€纾兼慨姗嗗幖閺嗗牓姊虹粙鍧楊€楅柨鏇樺劦婵＄敻宕熼姘敤闂侀潧臎閳ь剚鎱ㄩ崶銊х瘈婵炲牆鐏濋悘锟犳煙閸涘﹤鈻曠€殿喖顭烽幃銏ゅ礂閻撳簶鍋撻柨瀣ㄤ簻闁瑰搫绉堕ˇ锕傛煕閹捐埖鍤€闁?---
  const {
    healthChecks,
    healthSummary,
    isRunningHealthCheck,
    runHealthCheck
  } = useHealthCheck()

  // --- 闂傚倸鍊搁崐鎼佸磹閻戣姤鍤勯柛顐ｆ礀閸屻劎鎲搁弮鍫澪ラ柛鎰ㄦ櫆閸庣喖鏌曡箛瀣労婵炶尙顭堥埞鎴︽偐鐠囇冧紣闂佺粯顨呴敃顏勭暦閹达箑鐓涢柛娑卞枤閸樹粙姊洪柅娑樺祮婵炰匠鍕珷濞寸厧鐡ㄩ悡鍐磽娴ｈ偂鎴犵矆閳ь剙顪冮妶搴″绩婵炲娲熼獮鎴﹀礋椤栨矮绱堕梺鍛婃处閸樺€熲叿闂傚倸鍊风粈渚€骞楀鍫濈；闁绘ê鍚€閻掑﹥绻涢崱妯虹仸妞ゎ偅娲熼弻鐔煎箚瑜忛幗鐘测攽椤栨凹鍤熺紒杈ㄥ笧閳ь剨缍嗛崑鍕敋濠婂嫮绠鹃柛顐秵閸ゆ瑦銇勯鍕殻濠碘剝鍎肩粻娑㈠即閻愮數鍘抽梻鍌欑閹碱偊骞婅箛鏇熷床闁割偁鍎冲畵?---
  const [customTrainingPresets, setCustomTrainingPresets] = useState<TrainingPreset[]>([])
  const saveCustomTrainingPresets = useCallback((presets: TrainingPreset[]) => {
    setCustomTrainingPresets(presets)
    ;(window.huomiantong as any).saveCustomTrainingPresets?.(presets).catch(() => undefined)
  }, [])

  // --- 濠电姷鏁告慨鐑藉极閸涘﹥鍙忓ù鍏兼綑閸ㄥ倿鏌ｉ幘宕囧哺闁哄鐗楃换娑㈠箣閻愨晜锛堝┑鐐叉▕娴滄繈寮查幓鎺濈唵閻犺櫣灏ㄦΛ姘舵煕?---
  const {
    backupImportRef,
    backupStatus,
    exportBackup,
    handleBackupImport,
    openBackupImporter
  } = useSettingsBackup({
    currentSessionRef: sessionRef,
    replaceSessions,
    resetAnswerState,
    setCurrentSession: setSession,
    stopAudioTranscription
  })


  // --- 婵犵數濮烽弫鍛婃叏閻戣棄鏋侀柟闂寸绾惧鏌ｉ幇顒佹儓缂佺姵澹嗙槐鎺斺偓锝庡亽閸庛儵鏌涢妶鍡樼闁哄本鐩、鏇㈡晲閸℃瑯妲伴梻?---
  return (
    <div className={'app-shell' + (isScrollActive ? ' scrolling' : '')}>
      <SidebarNav activeView={activeView} onChangeView={setActiveView} collapsed={true} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main>
        <AppTopbar
          activeView={activeView}
          audioStatus={audioTopbarStatus}
          isRunningHealthCheck={isRunningHealthCheck}
          modelStatus={modelTopbarStatus}
          onOpenSettings={() => setActiveView('settings')}
          onRefreshSessions={refreshSessions}
          onRunHealthCheck={runHealthCheck}
          onSaveCurrentSession={saveCurrentSession}
          onOpenFloating={openFloatingWindow}
        />
        {activeView === 'workspace' && (
          <WorkspaceView
            audioSettings={{
              audioDeviceError,
              connectionLatencyMs: transcriptionStats.connectionLatencyMs,
              connectionStatus,
              activeSpeechProvider: settings.speech.sttProvider,
              speechEndpointingMs: settings.speech.endpointingMs,
              speechProviderReady: Boolean(
                (settings.speech.sttProvider === 'deepgram'
                  ? settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
                  : settings.speech.providers[settings.speech.sttProvider].apiKey
                ).trim()
              ),
              inputLevel,
              audioInputDevices,
              desktopAudioSources,
              isRefreshingAudioDevices,
              isRefreshingDesktopSources,
              isRunningMicrophoneDiagnostic,
              microphonePermission,
              microphoneDiagnostic,
              onRefreshAudioDevices: (requestPermission?: boolean) => refreshAudioDevices({ requestPermission }),
              onRefreshDesktopAudioSources: refreshDesktopAudioSources,
              onResetAudioUiState: resetAudioUiState,
              onRunMicrophoneDiagnostic: runMicrophoneDiagnostic,
              onSpeechEndpointingMsChange: (value) => updateSpeech({ endpointingMs: value }),
              onSpeechProviderChange: (provider) => updateSpeech({ sttProvider: provider }),
              selectedMicrophoneDeviceId,
              selectedMicrophoneLabel,
              selectedSystemSourceId,
              selectedSystemSourceName,
              onSelectedMicrophoneDeviceIdChange: setSelectedMicrophoneDeviceId,
              onSelectedSystemSourceIdChange: setSelectedSystemSourceId,
              systemAudioSupported,
              isListening,
              listeningMode
            }}
            resume={settings.resume}
            latestTranscript={latestTranscript}
            session={session}
            question={question}
            prepared={prepared}
            completed={completed}
            review={buildReview(session)}
            hasResume={settings.resume.formalResume.trim().length > 0}
            isListening={isListening}
            isTranscriptPaused={isTranscriptPaused}
            listeningMode={listeningMode}
            autoAnswer={autoAnswer}
            interimTranscript={interimTranscript}
            transcriptError={transcriptError}
            questionRewriteNotice={questionRewriteNotice}
            questionIntentNotice={questionIntentNotice}
            contextCompressionNotice={contextCompressionNotice}
            pausedTranscriptCount={pausedTranscriptCount}
            queuedCount={queuedCount}
            queuedAnswers={queuedAnswers}
            isGenerating={isGenerating}
            streamingText={streamingText}
            latencyReport={latencyReport}
            onSwitchResume={() => setActiveView('resume')}
            onStartAudioTranscription={startAudioTranscription}
            onStopAudioTranscription={stopAudioTranscription}
            onToggleTranscriptPause={handleToggleTranscriptPause}
            onToggleAutoAnswer={() => setAutoAnswer((prev) => !prev)}
            onStartNewSession={handleStartNewSession}
            onQuestionChange={setQuestion}
            onAddManualQuestion={addManualQuestion}
            onGenerateAnswer={generateAnswer}
            warmupAnswers={warmupState.answers}
            warmupIsGenerating={warmupState.isGenerating}
            warmupIsPaused={warmupState.isPaused}
            warmupProgress={warmupState.progress}
            warmupHasCache={warmupState.hasCache}
            warmupCachedAt={warmupState.cachedAt}
            warmupQuestionCount={warmupQuestionCount}
            onWarmupQuestionCountChange={(count) => setWarmupQuestionCount(count)}
            onStartWarmup={() => void startWarmup(warmupQuestionCount)}
            onPauseWarmup={pauseWarmup}
            onClearWarmupCache={clearWarmupCache}
            onExportCurrentReview={exportCurrentReview}
          />
        )}
        {activeView === 'checkup' && (
          <HealthCheckView
            checks={healthChecks}
            summary={healthSummary}
            isRunning={isRunningHealthCheck}
            onRun={runHealthCheck}
            onBackWorkspace={() => setActiveView('workspace')}
            onChangeView={setActiveView}
          />
        )}
        {activeView === 'help' && <HelpCenterView />}
        {activeView === 'interviewReview' && <InterviewReviewView onOpenSettings={() => setActiveView('settings')} />}
        {activeView === 'training' && (
          <TrainingView
            settings={settings}
            trainingMode={trainingSession.trainingMode}
            roundCount={trainingSession.roundCount}
            rounds={trainingSession.rounds}
            trainingTrendEntries={trainingSession.trainingTrendEntries}
            currentAnswer={trainingSession.currentAnswer}
            answerInterimTranscript={interimTranscript}
            answerSpeechStats={transcriptionStats}
            answerTranscriptError={transcriptError}
            finalReport={trainingSession.finalReport}
            answeredCount={trainingSession.answeredCount}
            canPersistTraining={trainingSession.canPersistTraining}
            draftSavedAt={trainingSession.draftSavedAt}
            hasTrainingDraft={trainingSession.hasTrainingDraft}
            isGeneratingTraining={trainingSession.isGeneratingTraining}
            isAnswerTranscribing={transcriptTarget === 'training-answer' && isListening}
            isSavingTraining={trainingSession.isSavingTraining}
            lastLatencyMs={trainingSession.lastLatencyMs}
            lastProvider={trainingSession.lastProvider}
            lastSavedAt={trainingSession.lastSavedAt}
            autoRestoredDraftAt={trainingSession.autoRestoredDraftAt ?? 0}
            onCurrentAnswerChange={trainingSession.setCurrentAnswer}
            onExportTraining={trainingSession.exportTraining}
            onOpenResume={() => setActiveView('resume')}
            onOpenRealisticInterview={() => setActiveView('realisticInterview')}
            onOpenSettings={() => setActiveView('settings')}
            onResetTraining={trainingSession.resetTraining}
            onRoundCountChange={trainingSession.setRoundCount}
            onRestoreTrainingDraft={trainingSession.restoreTrainingDraft}
            onSaveCustomTrainingPresets={saveCustomTrainingPresets}
            onSaveTrainingSession={trainingSession.saveTrainingSession}
            onSaveTrainingDraft={trainingSession.saveTrainingDraft}
            onClearTrainingDraft={trainingSession.clearTrainingDraft}
            onStartAnswerTranscription={() => {
              setTranscriptTarget('training-answer')
              void startAudioTranscription('microphone')
            }}
            onStartFocusedTraining={trainingSession.startFocusedTraining}
            onStartTraining={trainingSession.startTraining}
            onSubmitAnswer={trainingSession.submitAnswer}
            onFinishAnswer={(answerText) => {
              trainingAnswerActionsRef.current.finishAnswer(answerText)
            }}
            onStopAnswerTranscription={() => {
              setTranscriptTarget('workspace')
              stopAudioTranscription()
            }}
            onStartTrainingPreset={trainingSession.startTrainingFromPreset}
            onTrainingModeChange={trainingSession.setTrainingMode}
            onClearTrainingTrend={trainingSession.clearTrainingTrend}
          />
        )}
        {activeView === 'realisticInterview' && (
          <RealisticInterviewView
            settings={settings}
            roundCount={trainingSession.roundCount}
            rounds={trainingSession.rounds}
            currentAnswer={trainingSession.currentAnswer}
            answerInterimTranscript={interimTranscript}
            answerSpeechStats={transcriptionStats}
            answerTranscriptError={transcriptError}
            finalReport={trainingSession.finalReport}
            answeredCount={trainingSession.answeredCount}
            canPersistTraining={trainingSession.canPersistTraining}
            isGeneratingTraining={trainingSession.isGeneratingTraining}
            isAnswerTranscribing={transcriptTarget === 'training-answer' && isListening}
            isSavingTraining={trainingSession.isSavingTraining}
            lastLatencyMs={trainingSession.lastLatencyMs}
            lastProvider={trainingSession.lastProvider}
            onCurrentAnswerChange={trainingSession.setCurrentAnswer}
            onExportTraining={trainingSession.exportTraining}
            onOpenResume={() => setActiveView('resume')}
            onOpenSettings={() => setActiveView('settings')}
            onOpenTraining={() => setActiveView('training')}
            onMockInterviewConfigSaved={() => showToast('拟真面试配置已保存。', 'success')}
            onResetTraining={trainingSession.resetTraining}
            onRoundCountChange={trainingSession.setRoundCount}
            onSaveTrainingSession={trainingSession.saveTrainingSession}
            onStartAnswerTranscription={() => {
              setTranscriptTarget('training-answer')
              void startAudioTranscription('microphone')
            }}
            onStartTraining={trainingSession.startTraining}
            onSubmitAnswer={trainingSession.submitAnswer}
            onFinishAnswer={(answerText) => {
              trainingAnswerActionsRef.current.finishAnswer(answerText)
            }}
            onStopAnswerTranscription={() => {
              setTranscriptTarget('workspace')
              stopAudioTranscription()
            }}
          />
        )}
        {activeView === 'resume' && (
          <ResumeView
            filteredResumeProfiles={filteredResumeProfiles}
            isImportingResume={isImportingResume}
            onAddProfile={addResumeProfile}
            onDeleteProfile={deleteResumeProfile}
            onImportResume={importResume}
            onRemoveOtherResume={removeOtherResume}
            onResumeSearchChange={setResumeSearch}
            onSaveResume={saveResume}
            onSelectProfile={selectResumeProfile}
            onUpdateResume={updateResume}
            resumeImportStatus={resumeImportStatus}
            resumeSaveStatus={resumeSaveStatus}
            resumeSearch={resumeSearch}
            settings={settings}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView
            backupImportRef={backupImportRef}
            backupStatus={backupStatus}
            onBackupImportChange={handleBackupImport}
            onExportBackup={exportBackup}
            onOpenBackupImporter={openBackupImporter}
            onGenerateRoleJdWithAi={generateRoleJdWithAi}
            generatingRoleJdMode={generatingRoleJdMode}
          />
        )}
        {activeView === 'sessions' && (
          <SessionsView
            filteredSessions={filteredSessions}
            onCloseOpenedSession={() => setOpenedSession(null)}
            onDeleteSessions={deleteSelectedSessions}
            onExportSelectedSessions={exportSelectedSessions}
            onExportSessionMarkdown={exportSessionMarkdown}
            onExportSessionWord={exportSessionWord}
            onFilterChange={setSessionProfileFilter}
            onOpenSession={setOpenedSession}
            onRenameSession={renameSession}
            onStartFocusedTraining={async (plan) => {
              await trainingSession.startFocusedTraining(plan)
              setActiveView('training')
            }}
            onToggleSessionSelection={toggleSessionSelection}
            openedRecords={openedRecords}
            openedSession={openedSession}
            resumeProfiles={resumeProfiles}
            selectedSessionIds={selectedSessionIds}
            sessionProfileFilter={sessionProfileFilter}
            sessions={sessions}
          />
        )}
      </main>
      <UpdateExperience />
      {toast && <ToastNotice toast={toast} onOpenDiagnostics={openDiagnosticsFromToast} />}
    </div>
  )
}
