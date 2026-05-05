import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";

interface Props {
  bucket: "clinic-logos" | "clinic-banners" | "doctor-photos" | "service-images" | "avatars";
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: "square" | "wide";
}

export function ImageUpload({ bucket, value, onChange, label = "Upload image", aspect = "square" }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    if (!user) return toast.error("Sign in first");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  };

  const ratio = aspect === "wide" ? "aspect-[3/1]" : "aspect-square";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      <div className={`relative w-full overflow-hidden rounded-lg border bg-muted ${ratio} ${aspect === "square" ? "max-w-[160px]" : ""}`}>
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={() => onChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground transition hover:bg-muted/70"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span>{label}</span>
          </button>
        )}
      </div>
      {value && (
        <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
          Replace
        </Button>
      )}
    </div>
  );
}
