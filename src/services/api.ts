import { aiApi } from './aiApi';
import { analyticsApi } from './analyticsApi';
import { authApi } from './authApi';
import { chatApi } from './chatApi';
import { conditionalRulesApi } from './conditionalRulesApi';
import { formsApi } from './formsApi';
import { publicFormsApi } from './publicFormsApi';
import { questionsApi } from './questionsApi';
import { responsesApi } from './responsesApi';
import { storageApi } from './storageApi';

export const api = {
  auth: authApi,
  forms: formsApi,
  questions: questionsApi,
  conditionalRules: conditionalRulesApi,
  responses: responsesApi,
  publicForms: publicFormsApi,
  analytics: analyticsApi,
  chat: chatApi,
  ai: aiApi,
  storage: storageApi,
};
