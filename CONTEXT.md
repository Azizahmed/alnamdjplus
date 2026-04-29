# Domain Context

## Question Schema

The Question Schema is the Module that owns form question shape differences across the app. It normalizes database fields such as `type`, `label`, and `order` with UI aliases such as `question_type`, `question_text`, and `question_order`. It also owns settings aliases like `options` and `choices`, answer presence checks, required-question selection, and submit answer payload construction.

## Public Form Runtime

The Public Form Runtime is the Module that owns respondent-facing behavior for a published form. It evaluates conditional visibility rules, tracks answers by question id, prepares submit payloads, and builds required-answer feedback for visible questions.

## Function Runtime

The Function Runtime is the shared Module for InsForge edge function adapters. It owns CORS responses, JSON responses, authenticated and public InsForge client creation, and direct OpenRouter chat-completion calls from server-side environment variables.

## Client Data Access

Client Data Access is the Module family that owns InsForge SDK calls from the browser app. The public `api` Interface remains a small composition surface, while domain Modules own forms, questions, conditional rules, public forms, responses, analytics, chat, AI, auth, and storage.

## Form Editor

The Form Editor is the Module that owns builder-side question editing behavior. It creates question drafts, applies inline patches, merges modal edits, builds question save payloads, computes visible builder question ids, and reorders questions with contiguous order values.

## Builder Persistence

Builder Persistence is the Module that owns debounced saves from the form builder. It uses a Save Queue to coalesce rapid question and metadata edits before sending them through Client Data Access.

## Response Export

Response Export is the Module that owns converting stored responses and questions into JSON or CSV files. It keeps export formatting out of Client Data Access and page rendering code.
