'use client'
import { useRef, useState } from 'react';
import * as React from 'react';
import { Upload, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';

const FileUpload:React.FC = () => {
   
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);


    const handlefileUpload =async(e:React.ChangeEvent<HTMLInputElement>) =>{

       try{
       const file = e.target.files?.[0];
       if(!file)
        return;

       setIsUploading(true);
       const formData = new FormData();
       formData.append('pdf',file);

       const apiBaseUrl = getApiBaseUrl();

       await fetch(`${apiBaseUrl}/upload/pdf`,{
        method:'POST',
        body:formData,
       });
       setUploadedFiles(prev => [...prev, file]);
       toast.success("File uploaded sucessfully! Enjoy Talking")
      }catch{
        toast.error("Error in uploading files")
      } finally {
        setIsUploading(false);
        // Clear the input so the same file can be uploaded again if needed
        if (inputRef.current) {
            inputRef.current.value = '';
        }
      }
    }

    const triggerFileInput = () =>{
        if (!isUploading) {
            inputRef.current?.click();
        }
    }

  return (
    <div className='bg-slate-900 text-white shadow-2xl flex flex-col justify-center items-center p-6 rounded-3xl min-w-[250px]'>
        <div onClick={triggerFileInput} className={`flex justify-center items-center gap-4 cursor-pointer transition-opacity ${isUploading ? 'opacity-50' : 'hover:opacity-80'}`}>
        <h3 className="font-medium">{isUploading ? 'Uploading...' : 'Upload pdf file'}</h3>
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}

       {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handlefileUpload}
        className="hidden"
        disabled={isUploading}
      />
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 w-full max-w-full">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-300 bg-slate-800 px-3 py-2 rounded-lg w-full">
              <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload

