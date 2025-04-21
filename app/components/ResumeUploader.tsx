import React, { useState } from 'react';
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import { MdFileUpload, MdOutlineFilePresent } from "react-icons/md";

type Props = {
  setResumeText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setFileSelected: React.Dispatch<React.SetStateAction<boolean>>;
};

const ResumeUploader: React.FC<Props> = ({ 
  setResumeText, 
  setIsLoading,
  setFileSelected
}) => {
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

  const mergeTextContent = (textContent: TextContent) => {
    return textContent.items
      .map((item) => {
        const { str, hasEOL } = item as TextItem;
        return str + (hasEOL ? '\n' : '');
      })
      .join('');
  };

  const readResume = async (pdfFile: File | undefined) => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    if (!pdfFile) return;

    setFileName(pdfFile.name);
    setFileSelected(true);
    setProcessingStatus('Lecture du document...');

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (arrayBuffer && arrayBuffer instanceof ArrayBuffer) {
          try {
            const loadingTask = pdfjs.getDocument({
              data: new Uint8Array(arrayBuffer),
              // Enable enhanced options
              disableFontFace: true,
              standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
            });
            
            setProcessingStatus('Extraction du texte...');
            
            const pdfDoc = await loadingTask.promise;
            let completeText = '';
            
            // Get page count
            const numPages = pdfDoc.numPages;
            
            // Process all pages, not just the first one
            for (let i = 1; i <= Math.min(numPages, 10); i++) { // Limit to first 10 pages for performance
              setProcessingStatus(`Traitement de la page ${i}/${Math.min(numPages, 10)}...`);
              
              try {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = mergeTextContent(textContent);
                
                completeText += pageText + '\n\n---- Page ' + i + ' ----\n\n';
              } catch (pageError) {
                console.error(`Error extracting text from page ${i}:`, pageError);
                // Continue with other pages even if one fails
              }
            }
            
            // Ensure we have at least some text content
            if (completeText.trim().length < 50) {
              // If text is too short, try to get metadata as fallback
              const metadata = await pdfDoc.getMetadata();
              if (metadata && metadata.info) {
                completeText += `\nTitre: ${metadata.info.Title || 'Non disponible'}\n`;
                completeText += `Auteur: ${metadata.info.Author || 'Non disponible'}\n`;
                completeText += `Sujet: ${metadata.info.Subject || 'Non disponible'}\n`;
                completeText += `Mots-clés: ${metadata.info.Keywords || 'Non disponible'}\n`;
              }
              
              // Add a note about possible image-based PDF
              completeText += "\nRemarque: Ce PDF semble contenir principalement des images ou un contenu non textuel. " +
                "L'analyse pourrait être limitée.";
            }
            
            // Set the extracted text and update state
            setResumeText(completeText);
            setIsLoading(false);
            setProcessingStatus('');
            
          } catch (pdfError) {
            console.error('PDF Processing error:', pdfError);
            setError("Une erreur s'est produite lors du traitement du PDF. Il pourrait s'agir d'un document protégé ou corrompu.");
            setIsLoading(false);
            setFileSelected(false);
            setProcessingStatus('');
          }
        }
      };
      
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier. Veuillez réessayer.");
        setIsLoading(false);
        setFileSelected(false);
        setProcessingStatus('');
      };
      
      reader.readAsArrayBuffer(pdfFile);
      
    } catch (error) {
      console.error('File reading error:', error);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer avec un autre document.");
      setIsLoading(false);
      setFileSelected(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setResumeText('');
    setError('');
    setIsLoading(true);
    setProcessingStatus('');

    try {
      const items = event.dataTransfer.items;

      if (!items || items.length !== 1) {
        throw new Error('Veuillez déposer un seul fichier.');
      }
      const item = items[0];

      if (item.kind !== 'file' || item.type !== 'application/pdf') {
        throw new Error('Veuillez déposer un fichier PDF uniquement.');
      }
      const file = item.getAsFile();

      if (!file) {
        throw new Error("Le PDF n'a pas été correctement téléchargé.");
      }
      await readResume(file);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Une erreur s'est produite lors de la lecture du CV. Veuillez réessayer.");
      }
      setIsLoading(false);
      setFileSelected(false);
    }
    setIsDragOver(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleButtonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setIsLoading(true);
    setResumeText('');
    setProcessingStatus('');

    try {
      const file = event.target.files?.[0];
      if (!file) {
        throw new Error("Le PDF n'a pas été correctement téléchargé.");
      }
      await readResume(file);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Une erreur s'est produite lors de la lecture du CV. Veuillez réessayer.");
      }
      setIsLoading(false);
      setFileSelected(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer text-center
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
          ${fileName ? 'bg-blue-50 border-blue-400' : ''}`
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleButtonUpload}
          accept="application/pdf"
          className="hidden"
        />
        
        {fileName ? (
          <div className="flex flex-col items-center">
            <MdOutlineFilePresent className="h-10 w-10 text-blue-600 mb-2" />
            <p className="font-medium text-gray-800">{fileName}</p>
            {processingStatus ? (
              <p className="text-sm text-blue-600 mt-1 animate-pulse">{processingStatus}</p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">Fichier prêt pour l'analyse</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <MdFileUpload className="h-10 w-10 text-blue-600 mb-2" />
            <p className="font-medium text-gray-800">Déposez votre CV ici</p>
            <p className="text-sm text-gray-500 mt-1">ou</p>
            <label
              htmlFor="file-upload"
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Parcourir les fichiers
            </label>
            <p className="text-xs text-gray-500 mt-3">Formats acceptés: PDF uniquement</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-3 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;