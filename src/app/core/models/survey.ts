// Définir d'abord les interfaces qui ne dépendent pas des autres
export interface NmTypeQuest {
  id: number;
  code: string;
  libelle: string;
  libelleEn: string;
  coefficient: number;
  dtUpdate?: Date;
}

export interface NmAnswers {
  id: number;
  code: string;
  libelle: string;
  libelleEn: string;
  reference: string;
  dtUpdate?: Date;
}

export interface Answer {
  id?: number;
  code: string;
  libelle: string;
  libelleEn?: string;
  reference?: string;
  dtUpdate?: Date;
  condiQuestion?: Question[];
  condiSections?: Section[];
}

export interface Question {
  id?: number;
  idSectionQues?: number;
  code: string;
  titleFr: string;
  titleEn?: string;
  required: boolean;
  conditionnel: boolean;
  codeTypeQues?: string;
  libelleNmtype?: string;
  libelleEnNmtype?: string;
  hasConditions?: boolean;
  answers?: Answer[];
  parentAnswerId?: number;
}

export interface Section {
  id?: number;
  code: string;
  title: string;
  titleEn?: string;
  conditionnel: boolean;
  ordre: number;
  idSurvey?: number;
  dtUpdate?: Date;
  questions?: Question[];
  parentAnswerId?: number;
}

export interface Survey {
  id?: number;
  code: string;
  libelle: string;
  libelleEn?: string;
  dtAdd?: Date;
  dtUpdate?: Date;
  isValid?: boolean;
  isFormReference?: boolean;
  sections?: Section[];
}