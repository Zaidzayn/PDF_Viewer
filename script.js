pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.getElementById('pdf-render').appendChild(canvas);

// Trigger file input when the button is clicked
document.getElementById('file-input-button').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

// Handle file upload
document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = function () {
            const typedarray = new Uint8Array(this.result);
            loadPDF(typedarray);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please upload a valid PDF file.');
    }
});

// Load the PDF document
function loadPDF(pdfData) {
    pdfjsLib.getDocument(pdfData).promise.then((pdf) => {
        pdfDoc = pdf;
        pageNum = 1;
        document.getElementById('total-pages').textContent = pdf.numPages;
        renderPage(pageNum);
        // Enable navigation buttons
        document.getElementById('prev-page').disabled = false;
        document.getElementById('next-page').disabled = false;
    }).catch((error) => {
        alert('Error loading PDF.');
        console.error('Error loading PDF:', error);
    });
}

// Render the current page
function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then((page) => {
        // Get viewport and dynamically set scale
        const container = document.getElementById('pdf-render');
        const viewport = page.getViewport({ scale: 1 });
        const scale = container.clientWidth / viewport.width; // Scale based on container width

        const scaledViewport = page.getViewport({ scale });

        // Set canvas size to match scaled viewport
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport,
        };

        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    document.getElementById('current-page').textContent = num;
}

// Queue a page for rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Display the next page
document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
});

// Display the previous page
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
});
