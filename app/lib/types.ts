export type MessageRole = 'interviewer' | 'interviewee';

export interface MessageBlock {
  id: string;
  role: MessageRole;
  content: string;
}

export interface GlobalSettings {
  volume: string;
  issueDate: string;
  intervieweeName: string;
  intervieweeAffiliation: string;
  unitLabel: string;
  /** Square cover hero image on the first carousel card. */
  coverPhotoUrl: string | null;
  /** Circular interviewee avatar in Q&A bubbles. */
  photoUrl: string | null;
}

export interface DesignSettings {
  coverTextSize: number;
  abstractTextSize: number;
  interviewTextSize: number;
  interviewerBubbleColor: string;
  intervieweeBubbleColor: string;
  avatarSize: number;
  /** Vertical gap between stacked message rows (px). */
  interviewBubbleGap: number;
  /** Outer padding of the interview message column (px). */
  interviewContentPaddingTop: number;
  interviewContentPaddingX: number;
  interviewContentPaddingBottom: number;
  /** Padding inside each bubble (px). */
  interviewBubblePaddingY: number;
  interviewBubblePaddingX: number;
  /** 초록 제목 줄 (소속·이름·「인터뷰») */
  abstractTitleFontSize: number;
  abstractTitleFontWeight: number;
  abstractTitleUnderline: boolean;
  /** 초록 본문 `==`/`**` 에디터 형식 동일 */
  abstractBodyFontWeight: number;
  abstractBoldFontWeight: number;
  abstractBodyLineHeight: number;
  abstractHighlightColor: string;
  abstractTitleMarginBottom: number;
  abstractCardPaddingTop: number;
  abstractCardPaddingX: number;
  abstractFooterLabelFontSize: number;
  /** Carousel dots on cover + interview cards, and card counters in the editor preview. */
  showPageIndicators: boolean;
}

export interface AbstractData {
  text: string;
}

export interface InterviewData {
  messages: MessageBlock[];
  /** Message ids after which a manual page break is forced. */
  pageBreaksAfter?: string[];
}

export interface AppState {
  global: GlobalSettings;
  design: DesignSettings;
  abstract: AbstractData;
  interview: InterviewData;
}

export interface InterviewCardPage {
  messages: MessageBlock[];
  pageIndex: number;
}
