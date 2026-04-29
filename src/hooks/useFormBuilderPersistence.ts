import { useCallback, useEffect, useRef } from 'react';
import { createDebouncedSaveQueue } from '../domain/saveQueue.ts';
import { api } from '../services/api';

export const useFormBuilderPersistence = (formId: string) => {
  const questionSaveQueue = useRef(createDebouncedSaveQueue({ delayMs: 500 }));
  const formSaveQueue = useRef(createDebouncedSaveQueue({ delayMs: 500 }));

  const saveQuestion = useCallback(async (questionId: string, updates: Record<string, any>) => {
    try {
      const { error } = await api.questions.update(questionId, updates);
      if (error) {
        console.error('Failed to save question:', error);
      }
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  }, []);

  const saveFormMetadata = useCallback(async (title: string, description: string) => {
    try {
      const { error } = await api.forms.update(formId, { title, description });
      if (error) {
        console.error('Failed to save form metadata:', error);
      }
    } catch (err) {
      console.error('Failed to save form metadata:', err);
    }
  }, [formId]);

  const saveFormSettings = useCallback(async (settings: Record<string, any>) => {
    try {
      const { error } = await api.forms.update(formId, { settings });
      if (error) {
        console.error('Failed to save form settings');
      }
    } catch (err) {
      console.error('Error saving form settings:', err);
    }
  }, [formId]);

  const queueQuestionSave = useCallback((questionId: string, updates: Record<string, any>) => {
    questionSaveQueue.current.schedule(questionId, () => {
      void saveQuestion(questionId, updates);
    });
  }, [saveQuestion]);

  const queueFormMetadataSave = useCallback((title: string, description: string) => {
    formSaveQueue.current.schedule('metadata', () => {
      void saveFormMetadata(title, description);
    });
  }, [saveFormMetadata]);

  useEffect(() => {
    return () => {
      questionSaveQueue.current.cancelAll();
      formSaveQueue.current.cancelAll();
    };
  }, []);

  return {
    saveFormSettings,
    saveQuestion,
    queueQuestionSave,
    queueFormMetadataSave,
  };
};
