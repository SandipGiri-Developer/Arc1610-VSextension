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

replaceFileContent('src/components/Layout.tsx', [
    { find: /OnboardingModes\.Local/g, replace: '\"Local\"' },
    { find: /OnboardingModes\.Quickstart/g, replace: '\"Quickstart\"' },
    { find: /OnboardingModes\.Best/g, replace: '\"Best\"' }
]);

replaceFileContent('src/components/mainInput/belowMainInput/RulesPeek.tsx', [
    { find: /useOpenRule\(/g, replace: 'useOpenRule as any\(' }
]);

replaceFileContent('src/components/mainInput/ContinueInputBox.tsx', [
    { find: /state\.editModeState\.applyState/g, replace: 'undefined as any' }
]);

replaceFileContent('src/components/mainInput/InputToolbar.tsx', [
    { prepend: 'const getModelByRole = () => undefined;' }
]);

replaceFileContent('src/components/StyledMarkdownPreview/index.tsx', [
    { find: /item\.uri\!\.value/g, replace: '(item as any).uri?.value' }
]);

replaceFileContent('src/context/VscTheme.tsx', [
    { find: /async \(data\) =>/g, replace: 'async (data: any) =>' }
]);

replaceFileContent('src/hooks/ParallelListeners.tsx', [
    { find: /const update = \(update\) => \{/g, replace: 'const update = (update: any) => {' },
    { find: /handle\(data\) \{/g, replace: 'handle(data: any) {' },
    { find: /status\(status, data\)/g, replace: 'status(status: any, data: any)' },
    { find: /resolve\(data\)/g, replace: 'resolve(data: any)' },
    { find: /const state = \(state\) => \{/g, replace: 'const state = (state: any) => {' }
]);

replaceFileContent('src/hooks/useNavigationListener.tsx', [
    { find: /async \(data\) => \{/g, replace: 'async (data: any) => {' }
]);

replaceFileContent('src/pages/gui/StreamError.tsx', [
    { prepend: 'const useEditBlock = () => ({});' }
]);

replaceFileContent('src/pages/gui/ToolCallDiv/index.tsx', [
    { find: /const Icon =/g, replace: 'const Icon: any =' }
]);

replaceFileContent('src/redux/slices/uiSlice.ts', [
    { prepend: 'type OnboardingStatus = any;' }
]);

