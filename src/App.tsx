/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { RecitationStudio } from './components/RecitationStudio.tsx';
import { CorrectionResults } from './components/CorrectionResults.tsx';
import { TajweedKnowledgeHub } from './components/TajweedKnowledgeHub.tsx';
import { ProgressDashboard, SavedRecitationRecord } from './components/ProgressDashboard.tsx';
import { MethodologyModal } from './components/MethodologyModal.tsx';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { SURAHS_DATA, PRELOADED_TEST_RECITATIONS } from './data/quranData.ts';
import {
  RecitationAnalysisReport,
  UserProficiencyLevel,
  analyzeRecitationLocally
} from './utils/tajweedEngine.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab | 'correction'>('home');
  const [currentSurahId, setCurrentSurahId] = useState<number>(1);
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number>(1);
  const [quranFontSize, setQuranFontSize] = useState<number>(28);
  const [proficiencyLevel, setProficiencyLevel] = useState<UserProficiencyLevel>('intermediate');
  const [isAndroidFrameActive, setIsAndroidFrameActive] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<RecitationAnalysisReport | null>(null);
  const [previousReport, setPreviousReport] = useState<RecitationAnalysisReport | null>(null);

  // Persistent user history records
  const [savedRecords, setSavedRecords] = useState<SavedRecitationRecord[]>(() => {
    try {
      const stored = localStorage.getItem('mutqin_records');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'initial_sample_1',
        timestamp: 'أمس 08:30 م',
        surahId: 1,
        ayahNumber: 1,
        score: 95,
        level: 'intermediate',
        jaliErrors: 0,
        khafiErrors: 1
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mutqin_records', JSON.stringify(savedRecords));
    } catch (e) {
      // ignore
    }
  }, [savedRecords]);

  // Support ?autostart=1 or test query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setCurrentTab('recite');
    }
    if (params.get('sample')) {
      handleLaunchPreloadedTest(params.get('sample')!);
    }
  }, []);

  const handleChangeFontSize = (delta: number) => {
    setQuranFontSize((prev) => Math.max(20, Math.min(44, prev + delta)));
  };

  const handleLaunchPreloadedTest = (testId: string) => {
    const sample = PRELOADED_TEST_RECITATIONS.find((s) => s.id === testId);
    if (!sample) return;

    setCurrentSurahId(sample.surahId);
    setCurrentAyahNumber(sample.ayahNumber);

    const surah = SURAHS_DATA.find((s) => s.id === sample.surahId) || SURAHS_DATA[0];
    const ayah = surah.ayahs.find((a) => a.number === sample.ayahNumber) || surah.ayahs[0];

    setIsAnalyzing(true);

    setTimeout(() => {
      let report: RecitationAnalysisReport;

      if (sample.id === 'sample_fatihah_perfect') {
        const text = 'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 5200,
          rmsVolume: 0.06,
          snrDb: 26,
          silenceIntervals: [{ startMs: 2400, endMs: 2900, durationMs: 500 }],
          vowelSustainedDurations: [
            { wordIndex: 9, durationMs: 1680, estimatedHarakat: 6.0 }
          ],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'excellent'
        });
      } else if (sample.id === 'sample_fatihah_lahn_jali') {
        const text = 'صراط الذين أنعمتُ عليهم غير المغضوب عليهم ولا الضالين';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 4200,
          rmsVolume: 0.05,
          snrDb: 24,
          silenceIntervals: [],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'excellent'
        });
      } else if (sample.id === 'sample_fatihah_short_madd') {
        const text = 'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 3800,
          rmsVolume: 0.05,
          snrDb: 23,
          silenceIntervals: [],
          vowelSustainedDurations: [
            { wordIndex: 9, durationMs: 420, estimatedHarakat: 1.5 } // Short duration for Madd Lazim (1.5 instead of 6!)
          ],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'acceptable'
        });
      } else if (sample.id === 'sample_fatihah_letter_sub') {
        const text = 'السراط الزين أنعمت عليهم غير المغضوب عليهم ولا الضالين';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 4400,
          rmsVolume: 0.05,
          snrDb: 22,
          silenceIntervals: [],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'acceptable'
        });
      } else if (sample.id === 'sample_ikhlas_missing_qalqalah') {
        const text = 'قل هو الله أحدْ';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 2800,
          rmsVolume: 0.05,
          snrDb: 22,
          silenceIntervals: [],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'acceptable'
        });
      } else if (sample.id === 'sample_nas_cut_ghunnah') {
        const text = 'قل أعوذ برب الناس';
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 3100,
          rmsVolume: 0.05,
          snrDb: 24,
          silenceIntervals: [],
          vowelSustainedDurations: [
            { wordIndex: 4, durationMs: 250, estimatedHarakat: 0.9 }
          ],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'acceptable'
        });
      } else if (sample.id === 'sample_silent_noise') {
        report = analyzeRecitationLocally(ayah, '', proficiencyLevel, {
          durationMs: 400,
          rmsVolume: 0.002,
          snrDb: 5,
          silenceIntervals: [],
          isSilent: true,
          isNoisy: true,
          clarityGrade: 'unreliable'
        });
      } else {
        const text = ayah.words.map((w) => w.simple).join(' ');
        report = analyzeRecitationLocally(ayah, text, proficiencyLevel, {
          durationMs: 4000,
          rmsVolume: 0.05,
          snrDb: 22,
          silenceIntervals: [],
          isSilent: false,
          isNoisy: false,
          clarityGrade: 'acceptable'
        });
      }

      setPreviousReport(activeReport);
      setActiveReport(report);
      setIsAnalyzing(false);
      setCurrentTab('correction');

      // Save to history
      const newRecord: SavedRecitationRecord = {
        id: Date.now().toString(),
        timestamp: 'الآن',
        surahId: sample.surahId,
        ayahNumber: sample.ayahNumber,
        score: report.overallScore ?? 0,
        level: proficiencyLevel,
        jaliErrors: report.jaliErrorsCount,
        khafiErrors: report.khafiErrorsCount
      };
      setSavedRecords((prev) => [newRecord, ...prev]);
    }, 600);
  };

  const handleStartAnalysis = async (params: {
    audioBase64?: string;
    mimeType?: string;
    transcriptionFallback?: string;
    level: UserProficiencyLevel;
    focusCategory: string;
    acousticMetrics?: any;
    sampleId?: string;
  }) => {
    if (params.sampleId) {
      handleLaunchPreloadedTest(params.sampleId);
      return;
    }

    setIsAnalyzing(true);
    const surah = SURAHS_DATA.find((s) => s.id === currentSurahId) || SURAHS_DATA[0];
    const ayah = surah.ayahs.find((a) => a.number === currentAyahNumber) || surah.ayahs[0];

    try {
      const res = await fetch('/api/analyze-recitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: params.audioBase64,
          mimeType: params.mimeType,
          surahId: currentSurahId,
          ayahNumber: currentAyahNumber,
          proficiencyLevel: params.level,
          spokenTranscriptionFallback: params.transcriptionFallback,
          acousticMetrics: params.acousticMetrics
        })
      });

      if (!res.ok) {
        throw new Error('Analysis server response was not ok');
      }

      const report: RecitationAnalysisReport = await res.json();
      setPreviousReport(activeReport);
      setActiveReport(report);
      setCurrentTab('correction');

      // Add to local history only if successfully evaluated
      if (report.overallScore !== null) {
        const newRecord: SavedRecitationRecord = {
          id: Date.now().toString(),
          timestamp: 'الآن',
          surahId: currentSurahId,
          ayahNumber: currentAyahNumber,
          score: report.overallScore,
          level: params.level,
          jaliErrors: report.jaliErrorsCount,
          khafiErrors: report.khafiErrorsCount
        };
        setSavedRecords((prev) => [newRecord, ...prev]);
      }
    } catch (e) {
      console.warn('API error or offline mode, generating local analysis:', e);
      // Fallback local analysis: Use actual transcribed speech, NOT fake expected text!
      const fallbackReport = analyzeRecitationLocally(
        ayah,
        params.transcriptionFallback || '',
        params.level,
        params.acousticMetrics
      );
      setPreviousReport(activeReport);
      setActiveReport(fallbackReport);
      setCurrentTab('correction');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextAyah = () => {
    const currentSurah = SURAHS_DATA.find((s) => s.id === currentSurahId) || SURAHS_DATA[0];
    if (currentAyahNumber < currentSurah.ayahs.length) {
      setCurrentAyahNumber((n) => n + 1);
      setCurrentTab('recite');
    }
  };

  return (
    <AndroidFrame
      isAndroidFrameActive={isAndroidFrameActive}
      onToggleFrame={() => setIsAndroidFrameActive(!isAndroidFrameActive)}
    >
      {/* Mutqin Top App Navigation */}
      <Navbar
        currentTab={currentTab === 'correction' ? 'recite' : currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        quranFontSize={quranFontSize}
        onChangeFontSize={handleChangeFontSize}
        isAndroidFrameActive={isAndroidFrameActive}
        onToggleFrame={() => setIsAndroidFrameActive(!isAndroidFrameActive)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'home' && (
          <HomeScreen
            onSelectTab={(tab) => setCurrentTab(tab)}
            onSelectSurahAndAyah={(surahId, ayahNum) => {
              setCurrentSurahId(surahId);
              setCurrentAyahNumber(ayahNum);
              setCurrentTab('recite');
            }}
            onLaunchPreloadedTest={handleLaunchPreloadedTest}
            userStats={{
              totalSessions: savedRecords.length,
              averageScore:
                savedRecords.length > 0
                  ? Math.round(savedRecords.reduce((a, r) => a + r.score, 0) / savedRecords.length)
                  : 0,
              completedAyahsCount: new Set(savedRecords.map((r) => `${r.surahId}:${r.ayahNumber}`)).size
            }}
          />
        )}

        {currentTab === 'recite' && (
          <RecitationStudio
            currentSurahId={currentSurahId}
            currentAyahNumber={currentAyahNumber}
            quranFontSize={quranFontSize}
            proficiencyLevel={proficiencyLevel}
            onChangeLevel={setProficiencyLevel}
            onSelectSurah={setCurrentSurahId}
            onSelectAyah={setCurrentAyahNumber}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentTab === 'correction' && activeReport && (
          <CorrectionResults
            report={activeReport}
            surahId={currentSurahId}
            ayahNumber={currentAyahNumber}
            quranFontSize={quranFontSize}
            onRetryAyah={() => setCurrentTab('recite')}
            onNextAyah={handleNextAyah}
            previousReport={previousReport}
          />
        )}

        {currentTab === 'learn' && (
          <TajweedKnowledgeHub
            onStartPracticeWithRule={(ruleId) => {
              setCurrentTab('recite');
            }}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressDashboard
            records={savedRecords}
            onClearHistory={() => setSavedRecords([])}
            onSelectRecordToReview={(record) => {
              setCurrentSurahId(record.surahId);
              setCurrentAyahNumber(record.ayahNumber);
              handleLaunchPreloadedTest('sample_fatihah_perfect');
            }}
            onStartNewRecitation={() => setCurrentTab('recite')}
          />
        )}

        {currentTab === 'methodology' && <MethodologyModal />}
      </main>

      {/* Android Bottom Navigation */}
      <BottomNav
        currentTab={currentTab === 'correction' ? 'recite' : currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    </AndroidFrame>
  );
}
