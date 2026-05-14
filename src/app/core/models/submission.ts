export interface AnswerDetail {
  id: number;
  codeQuestion: string;
  questionText?: string;
  value: string;
  fileName?: string;
  fileType?: string;
  selectedOptions?: string[];
}

export interface Submission {
  id: number;
  surveyId: number;
  surveyLibelle: string;
  userId: number;
  username: string;
  submissionDate: string;
  status: string;
  validationComment?: string;
  validatedBy?: number;
  validatedAt?: string;
  answers: AnswerDetail[];
}