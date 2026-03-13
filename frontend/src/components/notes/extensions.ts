import { Extension } from '@tiptap/core';

export const SpacingExtension = Extension.create({
    name: 'spacing',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    lineHeight: {
                        default: null,
                        parseHTML: element => element.style.lineHeight || null,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) return {};
                            return { style: `line-height: ${attributes.lineHeight}` };
                        },
                    },
                    marginGap: {
                        default: null,
                        parseHTML: element => element.style.marginBottom || null,
                        renderHTML: attributes => {
                            if (!attributes.marginGap) return {};
                            return { style: `margin-bottom: ${attributes.marginGap}` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLineHeight: (lineHeight: string) => ({ commands }) => {
                return commands.setNode('paragraph', { lineHeight }) ||
                       commands.setNode('heading', { lineHeight });
            },
            setMarginGap: (marginGap: string) => ({ commands }) => {
                return commands.setNode('paragraph', { marginGap }) ||
                       commands.setNode('heading', { marginGap });
            },
        } as any;
    },
});
