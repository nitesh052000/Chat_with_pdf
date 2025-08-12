import Image from "next/image";
import FileUpload from "./components/FileUpload";
import ChatComponent from "./components/Chat";
import { Toaster } from "react-hot-toast";

export default function Home() {
  return (
   <div>
    <div className="min-h-screen w-screen flex">
     <div className="w-[30vw] mini-h-screen p-4 flex justify-center items-center"><FileUpload /></div>
     <div className="w-[70vw] min-h-screen border-l-2">
      <ChatComponent />
      <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
     </div>
    </div>
   </div>
  );
}
