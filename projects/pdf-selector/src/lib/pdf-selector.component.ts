import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { TextLayerRenderedEvent } from 'ngx-extended-pdf-viewer';
import { BoundingBox, LimitedSelectionEvent, TextSelection } from './pdf-selector';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const PDFViewerApplication: any;
@Component({
  selector: 'ng-pdf-selector',
  templateUrl: './pdf-selector.component.html',
})
export class PdfSelectorComponent implements OnInit, OnDestroy {

    @Input() selectedPage?: number;
    @Input() document!: string;
    @Input() preselectedBbox?: number[];
    @Output() readonly textSelectionEvent$ = new EventEmitter<TextSelection>();
    @Output() readonly limitedSelectionEvent$ = new EventEmitter<LimitedSelectionEvent>();

    public globalInstanceMouseDown?: (() => void);
    public globalInstanceMouseUp?: (() => void);
    private selectedText?: string;
    private previousSelected: { pageNumber?: number, pdfBbox?: number[] } = {}; 
    public limitedSelection = false;
    public limitedSelectionMessage: string | undefined;
    private textLayers: TextLayerRenderedEvent[] = [];
    public isPreselectedBboxLoaded = false;

    constructor(

        private elementRef: ElementRef,
        private renderer: Renderer2,

    ) { }

    ngOnInit(): void {

        if (!this.document) {

            // no op
            // this.selectedDocument = this.documents[ 0 ];

        }

        // this.resultService.displayDocumentPanelEvent$.subscribe((isToDisplay: boolean) => {

        //     if (isToDisplay) {

        //         this.onChangePage(this.selectedDocument.pages[ 0 ].number);

        //     }

        // });

    }

    ngOnDestroy(): void {

        // close mouse-down listener
        if (this.globalInstanceMouseDown) {

            this.globalInstanceMouseDown();

        }

    }

    // public onDocumentChange(): void {

    //     PDFViewerApplication.loadingBar.percent = 0;
    //     this.selectedPage = 1;
    //     this.limitedSelection = false;
    //     this.textLayers = [];

    // }

    public onChangePage(ev: number): void {

        // this.resultService.selectPageEvent$.next(ev);

        this.elementRef.nativeElement.querySelector('#area-selection')?.remove();

        if (this.previousSelected?.pageNumber === ev && this.previousSelected.pdfBbox) {

            this.showHighlight(this.previousSelected.pageNumber, this.previousSelected.pdfBbox)

        }

        // Set limited selection flag for each page
        const textLayer = this.textLayers.find(textLayer => textLayer.pageNumber === ev);

        if (textLayer) {

            this.limitedSelection = (

                textLayer.numTextDivs === 0

            )

            this.processLimitedSelectionPage();

        }

    }

    public loadPreselectedBbox(): void {

        if (this.isPreselectedBboxLoaded) {

            return;

        }

        if (this.preselectedBbox && this.selectedPage) {

            const pageIndex = this.selectedPage - 1; 
            const page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);

            const viewport = page.viewport

            const scaledBbox = this.preselectedBbox.map(boundingBox => boundingBox / 4 * viewport.scale);
            const boundingBox: number[] = viewport.convertToPdfPoint(scaledBbox[ 0 ], scaledBbox[ 1 ]).concat(
                viewport.convertToPdfPoint(scaledBbox[ 2 ], scaledBbox[ 3 ]));

            this.showHighlight(pageIndex, boundingBox);
            
            this.isPreselectedBboxLoaded = true;

        }

    }

    public addSelectListener(event: unknown): void {

        // if (this.resultService.openTableResult === true) {

        //     this.resultService.selectDocumentEvent$.next(this.selectedDocument);

        //     this.limitedSelectionMessage = 'The selection functionality on this page is not enabled for table answers. Please select the page and document that the answer exists on';
        //     this.limitedSelection = true;

        //     return;

        // }

        this.textLayers.push(event as TextLayerRenderedEvent);

        if ((event as TextLayerRenderedEvent).numTextDivs === 0) {

            this.limitedSelectionMessage = 'The selection functionality in this page or file is limited';
            this.limitedSelection = true;

        } else {

            this.limitedSelection = false; 

        }

        this.processLimitedSelectionPage();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textLayer: HTMLDivElement = (event as any).source.textLayer.div;
        if (!textLayer.hasAttribute('mouse-event-marker')) {

            // enable selection for textlayer children
            const textLayerChildren = textLayer.children
            for (let index = 0; index < textLayerChildren.length; index++) {

                const item = textLayerChildren.item(index) as Element;
                const parentElement = item.parentElement as HTMLElement;

                parentElement.style.userSelect = 'text';
                // textLayerChildren.item(index).parentElement.style.userSelect = 'text';

            }

            textLayer.setAttribute('mouse-event-marker', 'true');
            this.handleMouseDown(textLayer);

        }

    }

    private handleMouseDown(textLayer: HTMLDivElement): void {

        this.globalInstanceMouseDown = this.renderer.listen(textLayer, 'mousedown', (ev: MouseEvent) => {

            ev.stopPropagation();
            this.handleMouseUp(textLayer);

        });

    }

    private handleMouseUp(textLayer: HTMLDivElement): void {

        const globalInstanceMouseUp = this.renderer.listen(textLayer, 'mouseup', (ev: MouseEvent) => {

            ev.stopPropagation();

            if (

                window.Selection &&
                (window.getSelection() as Selection).toString() !== '' &&
                !(window.getSelection() as Selection).getRangeAt(0).collapsed

            ) {

                this.selectedText = (window.getSelection() as Selection).toString();

                const selected = this.getHightlightCoords();

                const textSelection: TextSelection = {

                    document: this.document as string,
                    pageIndex: selected.page,
                    text: this.selectedText,
                    boundingBox: selected.imageBbox,

                }

                this.textSelectionEvent$.emit(textSelection);

                this.showHighlight(selected.page, selected.pdfBbox);

            }

            // close mouse up listener
            globalInstanceMouseUp();

        });

    }

    private getHightlightCoords() {

        const pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
        const page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
        const pageRect = page.canvas.getClientRects()[ 0 ];
        const selection = window.getSelection() as Selection;
        const viewport = page.viewport;

        const textLayer = document.querySelector('.textLayer');

        const anchorRange = document.createRange();
        anchorRange.selectNodeContents(selection.anchorNode as Node);
        const anchorRect = anchorRange.getBoundingClientRect();

        const focusRange = document.createRange();
        focusRange.selectNodeContents(selection.focusNode as Node);
        const focusRect = focusRange.getBoundingClientRect();

        let startNode = selection.anchorNode;
        let startOffset = selection.anchorOffset;
        let endNode = selection.focusNode;
        let endOffset = selection.focusOffset;

        // Handle backward selection, when start position higher than end position or
        // at the same height but start position left larger than end position left
        // at the same node but start offset bigger than end offset
        if (
            (anchorRect.top > focusRect.top) || 
            ((anchorRect.top === focusRect.top) && (anchorRect.left > focusRect.left)) ||
            ((startNode === endNode) && (startOffset > endOffset))
        ) {

            startNode = selection.focusNode;
            startOffset = selection.focusOffset;
            endNode = selection.anchorNode;
            endOffset = selection.anchorOffset;

        }

        const nodes = this.getTextNodesBetween(textLayer as Element, startNode as Node, endNode as Node);

        const domRects: DOMRect[] = [];
        nodes.forEach(node => {

            const range = document.createRange();
            if (node === startNode) {

                if (startNode === endNode) {

                    range.setStart(node, startOffset);
                    range.setEnd(node, endOffset);

                } else {

                    range.setStart(node, startOffset);
                    range.setEnd(node, (node.textContent as string).length);

                }

            } else if (node === endNode) {

                range.setStart(node, 0);
                range.setEnd(node, endOffset);


            } else {

                range.setStart(node, 0);
                range.setEnd(node, (node.textContent as string).length);

            }

            domRects.push(range.getBoundingClientRect());

        })

        const left = Math.min.apply(null, domRects.map((item: DOMRect) => {

            return item.left;

        }));

        const top = Math.min.apply(null, domRects.map((item: DOMRect) => {

            return item.top;

        }));

        const right = Math.max.apply(null, domRects.map((item: DOMRect) => {

            return item.right;

        }));

        const bottom = Math.max.apply(null, domRects.map((item: DOMRect) => {

            return item.bottom;

        }));

        const boundingBox: number[] = viewport.convertToPdfPoint(left - pageRect.x, top - pageRect.y).concat(
            viewport.convertToPdfPoint(right - pageRect.x, bottom - pageRect.y));

        // Scaling pdfBbox to imageBbox
        // value used here is based on scaling process in the pipeline.
        const scale = (boundingBox: number) => {

            return boundingBox / viewport.scale * 4;

        }

        const imageBbox: BoundingBox = {

            x1: scale(left - pageRect.x),
            y1: scale(top - pageRect.y),
            x2: scale(right - pageRect.x),
            y2: scale(bottom - pageRect.y)

        }

        return { page: pageIndex, pdfBbox: boundingBox, imageBbox };

    }

    public showHighlight(pageNumber: number, pdfBbox: number[]): void {

        const pageIndex = pageNumber; 
        const page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);

        const pageElement = page.canvas.parentElement;
        const viewport = page.viewport;

        this.elementRef.nativeElement.querySelector('#area-selection')?.remove();
        this.previousSelected = { pageNumber: pageNumber, pdfBbox: pdfBbox };
        const bounds = viewport.convertToViewportRectangle(pdfBbox);

        const el = document.createElement('div');
        el.setAttribute('id', 'area-selection');
        el.setAttribute('style',
            `position: absolute; border: 1px solid blue; border-radius: 4px; padding: 4px; transform: translate(-4px, -4px); pointer-events: none;
            left: ${(Math.min(bounds[ 0 ], bounds[ 2 ])).toString()}px; 
            top: ${(Math.min(bounds[ 1 ], bounds[ 3 ])).toString()}px;
            width: ${(Math.abs(bounds[ 0 ] - bounds[ 2 ])).toString()}px; 
            height: ${(Math.abs(bounds[ 1 ] - bounds[ 3 ])).toString()}px;`);
        pageElement.appendChild(el);

    }

    private processLimitedSelectionPage(): void {

        const pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
        const limitedSelectionEvent: LimitedSelectionEvent = {

            isLimited: this.limitedSelection,
            pageIndex: pageIndex

        }

        this.limitedSelectionEvent$.emit(limitedSelectionEvent);

    }

    public afterPageRendered(): void {

        // Hide annotation layer to remove links in the pdf file.
        // Ref in this doc https://pdfviewer.net/extended-pdf-viewer/links is not working
        // since the pageView.div is not contains annotation layer. :(
        const annotationLayer = this.elementRef.nativeElement.querySelector('.annotationLayer');
        annotationLayer?.setAttribute('style', 'display: none');

        // Make div container unselectable.
        // To handle issue on firefox, which div container is selected instead of thetext itself.
        const textLayer = this.elementRef.nativeElement.querySelector('.textLayer') as HTMLElement;

        textLayer.style.userSelect = 'none';


        // set all childs under textLayer to be selectable
        // we doing this twice to handle unexpected behavior.
        // Here and after textLayer rendered.
        textLayer.childNodes.forEach (child => {

            (child as HTMLElement).style.userSelect = 'text';

        })

    }

    private getTextNodesBetween(rootNode: Element, startNode: Node, endNode: Node): Node[] {

        let pastStartNode = false;
        let reachedEndNode = false;
        const textNodes: Node[] = [];

        const getTextNodes = (node: Node) => {

            if (node === startNode) {

                pastStartNode = true;

                if (node.nodeType === 3) {

                    textNodes.push(node);

                }

                // startnode equal with endnode
                // selection is on the same node like just select 1 word or
                // multiple word in the same line
                if (node === endNode) {

                    reachedEndNode = true;

                }

            } else if (node === endNode) {

                reachedEndNode = true;

                if (node.nodeType === 3) {

                    textNodes.push(node);

                }

            } else if (node.nodeType === 3) {

                if (pastStartNode && !reachedEndNode && !/^\s*$/.test(node.nodeValue as string)) {

                    textNodes.push(node);

                }

            } else {

                if (!reachedEndNode) {

                    for (let i = 0, len = node.childNodes.length; i < len; ++i) {

                        getTextNodes(node.childNodes[ i ]);

                    }

                }

            }

        }

        getTextNodes(rootNode);

        return textNodes;

    }

    // Custom Progress Bar handle
    // Add this first to ngx-extended-pdf-viewer tag: 
    //    (progress)="onProgress($event)"
    // Uncomment this method
    // public onProgress(event: ProgressBarEvent): void {

    //     this.ngZone.run(() => {

    //         if (event.type === 'load') {

    //             this.progressPercentage = Math.round(event.percent);

    //             if (this.progressPercentage === 100) {

    //                 this.inProgress = false;

    //             }

    //         }

    //     })

    // }

    // hideProgressBar() {

    //     this.inProgress = false;

    // }

}

// import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
// import { TextLayerRenderedEvent } from 'ngx-extended-pdf-viewer';

// import { BoundingBox } from '../../../shared/interfaces/bounding-box.interface';
// import { EntityDocumentResponse } from '../../../work/task/entity-response.model';
// import { LimitedSelectionEvent, TextSelection } from './pdf-text-selector.interface';
// import { ResultService } from '../../../work/task/results/result.service';

// declare const PDFViewerApplication: any;

// @Component({
//     selector: 'app-pdf-text-selector',
//     templateUrl: './pdf-text-selector.component.html',
//     styleUrls: [ './pdf-text-selector.component.scss' ]
// })

