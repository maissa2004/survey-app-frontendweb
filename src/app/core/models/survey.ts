// Définir d'abord les interfaces qui ne dépendent pas des autres
export interface NmTypeQuest {
  id: number;
  code: string;
  libelle: string;
  libelleEn: string;
  coefficient: number;
  dtUpdate?: Date;
}

export interface EtatSurvey {
  id: number;
  libelle: string;
  libelleEn?: string;
  etat: boolean;  
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
  code: string;
  titleFr: string;
  titleEn?: string;
  reference?: string;
  descriptionFr?: string;
  description?: string;
  id_nm_type_quest: number;
  parentAnswerId?: number;
  answers?: Answer[];
  required: boolean;
  conditionnel: boolean | number;
}

export interface Section {
  id?: number;
  code: string;
  title: string;
  titleEn?: string;
  conditionnel: boolean | number;  
  ordre: number;
  idSurvey?: number;
  dtUpdate?: Date;
  questions?: Question[];
  parentAnswerId?: number;
  children?: Section[]; 
  idReferencedForm?: number; 
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
  idEtatSurvey?: number;     
  estActif?: boolean;  // ← Calculé à partir de idEtatSurvey, pas stocké en base
}