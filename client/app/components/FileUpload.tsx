'use client'
import { useRef } from 'react';
import * as React from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const FileUpload:React.FC = () => {
   
    const inputRef = useRef<HTMLInputElement>(null);


    const handlefileUpload =async(e:React.ChangeEvent<HTMLInputElement>) =>{

       try{
       const file = e.target.files?.[0];
       if(!file)
        return;

       const formData = new FormData();
       formData.append('pdf',file);

       await fetch('http://localhost:8000/upload/pdf',{
        method:'POST',
        body:formData,
       });
       toast.success("File uploaded sucessfully! Enjoy Talking")
       console.log("File uploaded");
      }catch(err){
        toast.error("Error in uploading files")
      }
    }

    const triggerFileInput = () =>{
        inputRef.current?.click();
    }

  return (
    <div className='bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4'>
        <div onClick={triggerFileInput} className='flex justify-center items-center gap-4 cursor-pointer'>
        <h3>Upload pdf file</h3>
      <Upload />

       {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handlefileUpload}
        className="hidden"
      />
      </div>
    </div>
  )
}

export default FileUpload
