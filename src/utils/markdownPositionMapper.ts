import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { Node } from 'unist';
import { PositionMapping } from '../types/comment';

interface MarkdownNode extends Node {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
  };
  depth?: number;
  ordered?: boolean;
  spread?: boolean;
  url?: string;
  title?: string;
  alt?: string;
}

export class MarkdownPositionMapper {
  private originalMarkdown: string;
  private renderedText: string = '';
  private positionMappings: PositionMapping[] = [];
  private ast: MarkdownNode;

  constructor(markdown: string) {
    this.originalMarkdown = markdown;
    this.ast = this.parseMarkdown(markdown);
    this.generateRenderedText();
  }

  private parseMarkdown(markdown: string): MarkdownNode {
    const processor = unified().use(remarkParse, { position: true });
    return processor.parse(markdown) as MarkdownNode;
  }

  private generateRenderedText(): void {
    this.renderedText = '';
    this.positionMappings = [];
    this.traverseNode(this.ast);
  }

  private traverseNode(node: MarkdownNode): void {
    switch (node.type) {
      case 'root':
        this.processChildren(node);
        break;
      
      case 'paragraph':
        this.processChildren(node);
        if (this.hasNextSibling(node)) {
          this.addText('\n');
        }
        break;
      
      case 'heading':
        this.processChildren(node);
        if (this.hasNextSibling(node)) {
          this.addText('\n');
        }
        break;
      
      case 'text':
        if (node.value && node.position) {
          this.addMappedText(
            node.value,
            node.position.start.offset,
            node.position.end.offset
          );
        }
        break;
      
      case 'strong':
      case 'emphasis':
        this.processChildren(node);
        break;
      
      case 'code':
        if (node.value && node.position) {
          this.addMappedText(
            node.value,
            node.position.start.offset,
            node.position.end.offset
          );
        }
        break;
      
      case 'inlineCode':
        if (node.value && node.position) {
          this.addMappedText(
            node.value,
            node.position.start.offset + 1,
            node.position.end.offset - 1
          );
        }
        break;
      
      case 'link':
        this.processChildren(node);
        break;
      
      case 'list':
        this.processChildren(node);
        if (this.hasNextSibling(node)) {
          this.addText('\n');
        }
        break;
      
      case 'listItem':
        this.addText('• ');
        this.processChildren(node);
        this.addText('\n');
        break;
      
      case 'blockquote':
        this.processChildren(node);
        if (this.hasNextSibling(node)) {
          this.addText('\n');
        }
        break;
      
      case 'thematicBreak':
        this.addText('---');
        if (this.hasNextSibling(node)) {
          this.addText('\n');
        }
        break;
      
      case 'break':
        this.addText('\n');
        break;
      
      default:
        this.processChildren(node);
        break;
    }
  }

  private hasNextSibling(node: MarkdownNode): boolean {
    return true;
  }

  private processChildren(node: MarkdownNode): void {
    if (node.children) {
      node.children.forEach(child => this.traverseNode(child));
    }
  }

  private addText(text: string): void {
    this.renderedText += text;
  }

  private addMappedText(text: string, markdownStart: number, markdownEnd: number): void {
    const renderedStart = this.renderedText.length;
    this.renderedText += text;
    const renderedEnd = this.renderedText.length;

    this.positionMappings.push({
      renderedStart,
      renderedEnd,
      markdownStart,
      markdownEnd,
      text
    });
  }

  public getRenderedText(): string {
    return this.renderedText;
  }

  public getPositionMappings(): PositionMapping[] {
    return this.positionMappings;
  }

  public mapRenderedToMarkdown(renderedStart: number, renderedEnd: number): { start: number; end: number; text: string } | null {
    const overlappingMappings = this.positionMappings.filter(mapping => 
      mapping.renderedStart < renderedEnd && mapping.renderedEnd > renderedStart
    );

    if (overlappingMappings.length === 0) {
      return null;
    }

    overlappingMappings.sort((a, b) => a.renderedStart - b.renderedStart);

    const firstMapping = overlappingMappings[0];
    const lastMapping = overlappingMappings[overlappingMappings.length - 1];

    const startMapping = firstMapping;
    const startOffset = Math.max(0, renderedStart - startMapping.renderedStart);
    const markdownStartOffset = this.calculateMarkdownOffset(startMapping, startOffset);

    const endMapping = lastMapping;
    const endOffset = Math.min(endMapping.renderedEnd - endMapping.renderedStart, renderedEnd - endMapping.renderedStart);
    const markdownEndOffset = this.calculateMarkdownOffset(endMapping, endOffset);

    const markdownStart = startMapping.markdownStart + markdownStartOffset;
    const markdownEnd = endMapping.markdownStart + markdownEndOffset;

    const markdownText = this.originalMarkdown.substring(markdownStart, markdownEnd);

    return {
      start: markdownStart,
      end: markdownEnd,
      text: markdownText
    };
  }

  private calculateMarkdownOffset(mapping: PositionMapping, textOffset: number): number {
    return textOffset;
  }

  public mapMarkdownToRendered(markdownStart: number, markdownEnd: number): { start: number; end: number; text: string } | null {
    const overlappingMappings = this.positionMappings.filter(mapping =>
      mapping.markdownStart < markdownEnd && mapping.markdownEnd > markdownStart
    );

    if (overlappingMappings.length === 0) {
      return null;
    }

    overlappingMappings.sort((a, b) => a.markdownStart - b.markdownStart);

    const firstMapping = overlappingMappings[0];
    const lastMapping = overlappingMappings[overlappingMappings.length - 1];

    const renderedStart = firstMapping.renderedStart + Math.max(0, markdownStart - firstMapping.markdownStart);
    const renderedEnd = lastMapping.renderedStart + Math.min(lastMapping.renderedEnd - lastMapping.renderedStart, markdownEnd - lastMapping.markdownStart);

    const renderedText = this.renderedText.substring(renderedStart, renderedEnd);

    return {
      start: renderedStart,
      end: renderedEnd,
      text: renderedText
    };
  }

  public getMappingSummary(): string {
    let summary = `Original Markdown (${this.originalMarkdown.length} chars):\n`;
    summary += `"${this.originalMarkdown.substring(0, 100)}${this.originalMarkdown.length > 100 ? "..." : ""}"\n\n`;
    
    summary += `Rendered Text (${this.renderedText.length} chars):\n`;
    summary += `"${this.renderedText.substring(0, 100)}${this.renderedText.length > 100 ? "..." : ""}"\n\n`;
    
    summary += `Position Mappings (${this.positionMappings.length} total):\n`;
    this.positionMappings.slice(0, 5).forEach((mapping, index) => {
      summary += `${index + 1}. Rendered[${mapping.renderedStart}-${mapping.renderedEnd}] -> Markdown[${mapping.markdownStart}-${mapping.markdownEnd}]: "${mapping.text}"\n`;
    });
    
    if (this.positionMappings.length > 5) {
      summary += `... and ${this.positionMappings.length - 5} more mappings\n`;
    }
    
    return summary;
  }
} 