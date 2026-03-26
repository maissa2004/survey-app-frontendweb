import { Routes } from '@angular/router';
import { SurveyListComponent } from './features/survey/survey-list/survey-list.component';
import { SurveyFormComponent } from './features/survey/survey-form/survey-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/surveys', pathMatch: 'full' },
  { path: 'surveys', component: SurveyListComponent },
  { path: 'surveys/new', component: SurveyFormComponent },
  { path: 'surveys/edit/:id', component: SurveyFormComponent }
];