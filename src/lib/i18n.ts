import type { Language } from "../config/schema";

export interface InitMessages {
  intro: string;
  selectLanguage: string;
  languageKo: string;
  languageEn: string;
  configureSeverity: string;
  severityLow: string;
  severityMedium: string;
  severityHigh: string;
  configureMaxComments: string;
  maxCommentsPlaceholder: string;
  enableAutoReview: string;
  enableDraftReview: string;
  enableIssueWorkflow: string;
  enableAutoTriage: string;
  enableCodeWorkspace: string;
  creating: string;
  created: string;
  cancelled: string;
  setupComplete: string;
  errorExists: string;
  useForce: string;
}

export const messages: Record<Language, InitMessages> = {
  ko: {
    intro: "🤖 PleaseAI 설정",
    selectLanguage: "봇 응답 언어를 선택하세요",
    languageKo: "🇰🇷 한국어 (Korean)",
    languageEn: "🇺🇸 English",
    configureSeverity: "리뷰 댓글의 최소 심각도를 선택하세요",
    severityLow: "LOW - 모든 제안 포함",
    severityMedium: "MEDIUM - 중요한 제안만",
    severityHigh: "HIGH - 심각한 문제만",
    configureMaxComments: "최대 리뷰 댓글 수를 입력하세요",
    maxCommentsPlaceholder: "-1 (무제한)",
    enableAutoReview: "PR이 열렸을 때 자동으로 코드 리뷰를 수행할까요?",
    enableDraftReview: "Draft PR도 자동 리뷰에 포함할까요?",
    enableIssueWorkflow: "Issue 워크플로우 (triage → investigate → fix)를 활성화할까요?",
    enableAutoTriage: "새 이슈를 자동으로 분류할까요?",
    enableCodeWorkspace: "코드 워크스페이스 기능을 활성화할까요?",
    creating: ".please/config.yml 생성 중",
    created: "✓ 설정이 성공적으로 생성되었습니다",
    cancelled: "설정이 취소되었습니다",
    setupComplete: "설정 완료!",
    errorExists: "❌ .please/config.yml 파일이 이미 존재합니다",
    useForce: "--force 플래그를 사용하여 덮어쓸 수 있습니다",
  },
  en: {
    intro: "🤖 PleaseAI Configuration",
    selectLanguage: "Select bot response language",
    languageKo: "🇰🇷 한국어 (Korean)",
    languageEn: "🇺🇸 English",
    configureSeverity: "Select minimum severity level for review comments",
    severityLow: "LOW - Include all suggestions",
    severityMedium: "MEDIUM - Important suggestions only",
    severityHigh: "HIGH - Critical issues only",
    configureMaxComments: "Enter maximum number of review comments",
    maxCommentsPlaceholder: "-1 (unlimited)",
    enableAutoReview: "Automatically perform code review when PR is opened?",
    enableDraftReview: "Include draft PRs in automatic reviews?",
    enableIssueWorkflow: "Enable issue workflow (triage → investigate → fix)?",
    enableAutoTriage: "Automatically triage new issues?",
    enableCodeWorkspace: "Enable code workspace features?",
    creating: "Creating .please/config.yml",
    created: "✓ Configuration created successfully",
    cancelled: "Configuration cancelled",
    setupComplete: "Setup complete!",
    errorExists: "❌ .please/config.yml already exists",
    useForce: "Use --force flag to overwrite",
  },
};

export function getMessages(language: Language): InitMessages {
  return messages[language];
}

/**
 * Detect system language from environment variables
 */
export function detectSystemLanguage(): Language {
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || "";
  return lang.startsWith("ko") ? "ko" : "en";
}
