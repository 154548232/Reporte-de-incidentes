document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE PRIORIDAD ---
    const priorityOptions = document.querySelectorAll('.priority-option');
    const incidentSection = document.getElementById('incident-section');

    if (incidentSection) {
        priorityOptions.forEach(option => {
            option.addEventListener('click', function() {
                priorityOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const priorityLevel = this.dataset.priority;
                incidentSection.className = 'section'; 
                incidentSection.classList.add(`priority-${priorityLevel}`);
            });
        });
    }

    // --- CÁLCULO AUTOMÁTICO DE MÉTRICAS DE TIEMPO ---
    const occurrenceInput = document.getElementById('fecha-ocurrencia');
    const detectionInput = document.getElementById('fecha-deteccion');
    const reportInput = document.getElementById('fecha-reporte');
    const containmentInput = document.getElementById('fecha-contencion');
    
    const mttdOutput = document.getElementById('mttd-output');
    const mttrOutput = document.getElementById('mttr-output');
    const mttcOutput = document.getElementById('mttc-output');
    
    function calculateTimeDiff(start, end) {
        if (!start || !end) return '';
        const diffMs = end - start;
        if (diffMs < 0) return 'Fecha inválida';
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes >= 0 || result === '') result += `${minutes}m`;
        return result.trim();
    }

    function updateAllMetrics() {
        const occurrenceDate = occurrenceInput.value ? new Date(occurrenceInput.value) : null;
        const detectionDate = detectionInput.value ? new Date(detectionInput.value) : null;
        const reportDate = reportInput.value ? new Date(reportInput.value) : null;
        const containmentDate = containmentInput.value ? new Date(containmentInput.value) : null;

        if (mttdOutput) mttdOutput.value = calculateTimeDiff(occurrenceDate, detectionDate);
        if (mttrOutput) mttrOutput.value = calculateTimeDiff(detectionDate, reportDate);
        if (mttcOutput) mttcOutput.value = calculateTimeDiff(detectionDate, containmentDate);
    }
    
    [occurrenceInput, detectionInput, reportInput, containmentInput].forEach(input => {
        if (input) {
            input.addEventListener('change', updateAllMetrics);
        }
    });

    // --- LÓGICA PARA GENERAR EL PDF ---
    const pdfButton = document.getElementById('generate-pdf-btn');
    const formContainer = document.getElementById('form-container');
    const buttonContainer = document.querySelector('.button-container');

    if (pdfButton && formContainer && buttonContainer) {
        pdfButton.addEventListener('click', function() {
            pdfButton.disabled = true;
            pdfButton.textContent = '🔄 Generando PDF, por favor espera...';
            buttonContainer.style.display = 'none';

            const options = {
                scale: 2,
                useCORS: true,
                logging: false,
            };

            html2canvas(formContainer, options).then(canvas => {
                buttonContainer.style.display = 'block';

                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/png');
                const doc = new jsPDF({
                    orientation: 'p',
                    unit: 'pt',
                    format: 'a4',
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const ratio = canvas.height / canvas.width;
                const pdfImageHeight = pageWidth * ratio;
                let heightLeft = pdfImageHeight;
                let position = 0;

                doc.addImage(imgData, 'PNG', 0, position, pageWidth, pdfImageHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - pdfImageHeight;
                    doc.addPage();
                    doc.addImage(imgData, 'PNG', 0, position, pageWidth, pdfImageHeight);
                    heightLeft -= pageHeight;
                }

                doc.save('reporte-incidente-seguridad.pdf');

                pdfButton.disabled = false;
                pdfButton.textContent = '📄 Generar PDF del Reporte';
            }).catch(error => {
                console.error("Error al generar el PDF:", error);
                buttonContainer.style.display = 'block';
                pdfButton.disabled = false;
                pdfButton.textContent = '⚠️ Error. Intentar de nuevo';
            });
        });
    }
});