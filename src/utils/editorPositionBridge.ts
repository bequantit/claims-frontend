import { Editor } from '@tiptap/react';
import { MarkdownPositionMapper } from './markdownPositionMapper';

export class EditorPositionBridge {
  private editor: Editor;
  private positionMapper: MarkdownPositionMapper;
  private renderedText: string;
  private editorText: string;

  constructor(editor: Editor, positionMapper: MarkdownPositionMapper) {
    this.editor = editor;
    this.positionMapper = positionMapper;
    this.renderedText = positionMapper.getRenderedText();
    this.editorText = editor.state.doc.textContent;
  }


  public editorToRenderedPosition(editorPos: number): number {
    const contextSize = 50;
    const start = Math.max(0, editorPos - contextSize);
    const end = Math.min(this.editorText.length, editorPos + contextSize);
    
    const beforeText = this.editorText.substring(start, editorPos);
    const afterText = this.editorText.substring(editorPos, end);
    
    const renderedPos = this.findPositionInRendered(beforeText, afterText);
    return renderedPos !== -1 ? renderedPos : this.proportionalMapping(editorPos);
  }

  public renderedToEditorPosition(renderedPos: number): number {
    const contextSize = 50;
    const start = Math.max(0, renderedPos - contextSize);
    const end = Math.min(this.renderedText.length, renderedPos + contextSize);
    
    const beforeText = this.renderedText.substring(start, renderedPos);
    const afterText = this.renderedText.substring(renderedPos, end);
    
    const editorPos = this.findPositionInEditor(beforeText, afterText);
    return editorPos !== -1 ? editorPos : this.proportionalMappingToEditor(renderedPos);
  }

  public editorSelectionToMarkdown(editorFrom: number, editorTo: number): { 
    markdownStart: number; 
    markdownEnd: number; 
    markdownText: string; 
    renderedText: string;
  } | null {
    const selectedText = this.editor.state.doc.textBetween(editorFrom, editorTo);
    
    const renderedMatch = this.findTextInRendered(selectedText, editorFrom);
    
    if (!renderedMatch) {
      console.warn('Could not find selected text in rendered version:', selectedText);
      return null;
    }
    
    const markdownMapping = this.positionMapper.mapRenderedToMarkdown(
      renderedMatch.start, 
      renderedMatch.end
    );
    
    if (!markdownMapping) {
      console.warn('Could not map rendered positions to markdown:', renderedMatch);
      return null;
    }
    
    return {
      markdownStart: markdownMapping.start,
      markdownEnd: markdownMapping.end,
      markdownText: markdownMapping.text,
      renderedText: this.renderedText.substring(renderedMatch.start, renderedMatch.end)
    };
  }

  private findTextInRendered(text: string, editorPos: number): { start: number; end: number } | null {
    const cleanText = text.trim();
    if (!cleanText) return null;
    
    const occurrences: { start: number; end: number; score: number }[] = [];
    
    let searchPos = 0;
    while (true) {
      const index = this.renderedText.indexOf(cleanText, searchPos);
      if (index === -1) break;
      
      const score = this.calculateContextScore(editorPos, index);
      occurrences.push({
        start: index,
        end: index + cleanText.length,
        score
      });
      
      searchPos = index + 1;
    }
    
    if (occurrences.length === 0) {
      return this.fuzzyFindText(cleanText);
    }
    
    occurrences.sort((a, b) => b.score - a.score);
    return occurrences[0];
  }

  private calculateContextScore(editorPos: number, renderedPos: number): number {
    const contextSize = 100;
    
    const editorBefore = this.editorText.substring(
      Math.max(0, editorPos - contextSize), 
      editorPos
    ).trim();
    
    const renderedBefore = this.renderedText.substring(
      Math.max(0, renderedPos - contextSize), 
      renderedPos
    ).trim();
    
    const similarity = this.calculateSimilarity(editorBefore, renderedBefore);
    
    const editorRatio = editorPos / this.editorText.length;
    const renderedRatio = renderedPos / this.renderedText.length;
    const positionSimilarity = 1 - Math.abs(editorRatio - renderedRatio);
    
    return similarity * 0.7 + positionSimilarity * 0.3;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let commonWords = 0;
    for (const word of words1) {
      if (words2.includes(word)) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  private fuzzyFindText(text: string): { start: number; end: number } | null {
    const normalizedText = text.replace(/[^\w\s]/g, '').toLowerCase();
    const normalizedRendered = this.renderedText.replace(/[^\w\s]/g, '').toLowerCase();
    
    const index = normalizedRendered.indexOf(normalizedText);
    if (index !== -1) {
      const ratio = index / normalizedRendered.length;
      const originalPos = Math.floor(ratio * this.renderedText.length);
      
      return {
        start: originalPos,
        end: originalPos + text.length
      };
    }
    
    return null;
  }

  private findPositionInRendered(beforeText: string, afterText: string): number {
    for (let i = 0; i < this.renderedText.length; i++) {
      const renderedBefore = this.renderedText.substring(Math.max(0, i - beforeText.length), i);
      const renderedAfter = this.renderedText.substring(i, i + afterText.length);
      
      if (this.textsMatch(beforeText, renderedBefore) && this.textsMatch(afterText, renderedAfter)) {
        return i;
      }
    }
    return -1;
  }

  private findPositionInEditor(beforeText: string, afterText: string): number {
    for (let i = 0; i < this.editorText.length; i++) {
      const editorBefore = this.editorText.substring(Math.max(0, i - beforeText.length), i);
      const editorAfter = this.editorText.substring(i, i + afterText.length);
      
      if (this.textsMatch(beforeText, editorBefore) && this.textsMatch(afterText, editorAfter)) {
        return i;
      }
    }
    return -1;
  }

  private textsMatch(text1: string, text2: string): boolean {
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();
    return normalize(text1) === normalize(text2);
  }

  private proportionalMapping(editorPos: number): number {
    const ratio = editorPos / this.editorText.length;
    return Math.floor(ratio * this.renderedText.length);
  }

  private proportionalMappingToEditor(renderedPos: number): number {
    const ratio = renderedPos / this.renderedText.length;
    return Math.floor(ratio * this.editorText.length);
  }

  public getDebugInfo(): {
    editorTextLength: number;
    renderedTextLength: number;
    editorText: string;
    renderedText: string;
    mappingSummary: string;
    textComparison: {
      editorSample: string;
      renderedSample: string;
      similarity: number;
    };
  } {
    const editorSample = this.editorText.substring(0, 200);
    const renderedSample = this.renderedText.substring(0, 200);
    
    return {
      editorTextLength: this.editorText.length,
      renderedTextLength: this.renderedText.length,
      editorText: editorSample + (this.editorText.length > 200 ? '...' : ''),
      renderedText: renderedSample + (this.renderedText.length > 200 ? '...' : ''),
      mappingSummary: this.positionMapper.getMappingSummary(),
      textComparison: {
        editorSample,
        renderedSample,
        similarity: this.calculateSimilarity(editorSample, renderedSample)
      }
    };
  }
} 