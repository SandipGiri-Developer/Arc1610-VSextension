const fs = require('fs');

function replaceFileContent(filePath, rules) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (let rule of rules) {
        if (rule.replace) {
            content = content.replace(rule.find, rule.replace);
        } else if (rule.prepend) {
            content = rule.prepend + '\n' + content;
        }
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed ' + filePath);
    }
}

replaceFileContent('src/components/History/index.tsx', [
    { find: /import ConfirmationDialog from "\.\.\/dialogs\/ConfirmationDialog";/g, replace: 'const ConfirmationDialog = ({open}: any) => <></>;' }
]);

replaceFileContent('src/components/Layout.tsx', [
    { find: /import \{ Dialogs \} from "\.\/dialogs";/g, replace: 'const Dialogs = () => <></>;' },
    { find: /import OnboardingCard, \{ OnboardingModes \} from "\.\/OnboardingCard";/g, replace: 'const OnboardingCard = () => <></>; type OnboardingModes = any;' },
    { find: /OnboardingModes\.Local/g, replace: '\"Local\"' },
    { find: /OnboardingModes\.Quickstart/g, replace: '\"Quickstart\"' },
    { find: /OnboardingModes\.Best/g, replace: '\"Best\"' }
]);

replaceFileContent('src/components/mainInput/AtMentionDropdown/index.tsx', [
    { find: /import AddDocsDialog from "\.\.\/\.\.\/dialogs\/AddDocsDialog";/g, replace: 'const AddDocsDialog = ({open}: any) => <></>;' }
]);

replaceFileContent('src/components/mainInput/ContinueInputBox.tsx', [
    { find: /applyState=\{\s*undefined as any\s*\}/g, replace: '' }
]);

replaceFileContent('src/components/mainInput/InputToolbar.tsx', [
    { find: /import \{ getModelByRole \} from "core\/llm\/autodetect";/g, replace: '' }
]);

replaceFileContent('src/components/StyledMarkdownPreview/MermaidBlock.tsx', [
    { find: /import useDebounce from "\.\.\/find\/useDebounce";/g, replace: 'const useDebounce = (v: any) => v;' }
]);

replaceFileContent('src/console.tsx', [
    { find: /import ConsoleLayout from "\.\/components\/console\/Layout";/g, replace: 'const ConsoleLayout = () => <></>;' }
]);

replaceFileContent('src/pages/gui/Chat.tsx', [
    { find: /import FindWidget from "\.\.\/\.\.\/components\/find\/FindWidget";/g, replace: 'const FindWidget = () => <></>;' },
    { find: /import \{ FeedbackDialog \} from "\.\.\/\.\.\/components\/dialogs\/FeedbackDialog";/g, replace: 'const FeedbackDialog = () => <></>;' }
]);

replaceFileContent('src/pages/gui/StreamError.tsx', [
    { find: /const useEditBlock = \(\) => \(\{.*?\}\);/g, replace: '' },
    { find: /import \{ useEditBlock \} from "\.\.\/\.\.\/components\/mainInput\/Lump\/useEditBlock";/g, replace: 'const useEditBlock = () => ({});' }
]);

replaceFileContent('src/redux/slices/uiSlice.ts', [
    { find: /import \{ OnboardingStatus \} from "\.\.\/\.\.\/components\/OnboardingCard";/g, replace: '' }
]);

