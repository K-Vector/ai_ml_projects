import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";


interface VerificationResult {
  success: boolean;
  matches: Record<string, boolean>;
  details: string[];
  extracted_text: string;
}

export default function LabelVerification() {
  const [formData, setFormData] = useState({
    brandName: "",
    productClass: "",
    alcoholContent: "",
    netContents: "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  const verifyMutation = trpc.verification.verifyLabel.useMutation({
    onSuccess: (data) => {
      setVerificationResult(data as VerificationResult);
    },
    onError: (error) => {
      setVerificationResult({
        success: false,
        matches: {},
        details: [`Error: ${error.message}`],
        extracted_text: "",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setVerificationResult(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setVerificationResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      alert("Please upload a label image");
      return;
    }

    if (!formData.brandName || !formData.productClass || !formData.alcoholContent) {
      alert("Please fill in all required fields");
      return;
    }

    // Read image as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      
      // Call verification API with base64 image directly
      verifyMutation.mutate({
        imageBase64: base64Image,
        brandName: formData.brandName,
        productClass: formData.productClass,
        alcoholContent: parseFloat(formData.alcoholContent),
        netContents: formData.netContents || '',
      });
    };
    reader.readAsDataURL(imageFile);
  };

  const handleReset = () => {
    setFormData({
      brandName: "",
      productClass: "",
      alcoholContent: "",
      netContents: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            AI-Powered Alcohol Label Verification
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload an alcohol beverage label and verify if the information matches your product details. 
            This tool simulates the TTB label approval process.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Enter the details from your TTB application form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="brandName">
                    Brand Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    placeholder="e.g., Old Tom Distillery"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange("brandName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productClass">
                    Product Class/Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productClass"
                    placeholder="e.g., Kentucky Straight Bourbon Whiskey"
                    value={formData.productClass}
                    onChange={(e) => handleInputChange("productClass", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcoholContent">
                    Alcohol Content (% ABV) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="alcoholContent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 45"
                    value={formData.alcoholContent}
                    onChange={(e) => handleInputChange("alcoholContent", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netContents">
                    Net Contents (Optional)
                  </Label>
                  <Input
                    id="netContents"
                    placeholder="e.g., 750 mL"
                    value={formData.netContents}
                    onChange={(e) => handleInputChange("netContents", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labelImage">
                    Label Image <span className="text-red-500">*</span>
                  </Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <input
                      id="labelImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="labelImage" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">
                        {imageFile ? imageFile.name : "Click to upload label image"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Label"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Image Preview & Results */}
          <div className="space-y-6">
            {/* Image Preview */}
            {imagePreview && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Label Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={imagePreview}
                    alt="Label preview"
                    className="w-full h-auto rounded-lg border border-slate-200"
                  />
                </CardContent>
              </Card>
            )}

            {/* Verification Results */}
            {verificationResult && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {verificationResult.success ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <span className="text-green-700">Verification Successful</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-600" />
                        <span className="text-red-700">Verification Failed</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {verificationResult.success
                      ? "The label matches the form data. All required information is consistent."
                      : "Discrepancies found between the label and form data."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detailed Results */}
                  <div className="space-y-2">
                    {verificationResult.details.map((detail, index) => {
                      const isSuccess = detail.startsWith("✓");
                      const isWarning = detail.startsWith("⚠");
                      const isError = detail.startsWith("✗");
                      
                      return (
                        <Alert
                          key={index}
                          variant={isError ? "destructive" : "default"}
                          className={
                            isSuccess
                              ? "border-green-200 bg-green-50 text-green-800"
                              : isWarning
                              ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                              : ""
                          }
                        >
                          {isSuccess && <CheckCircle2 className="h-4 w-4" />}
                          {isWarning && <AlertCircle className="h-4 w-4" />}
                          {isError && <XCircle className="h-4 w-4" />}
                          <AlertDescription>{detail}</AlertDescription>
                        </Alert>
                      );
                    })}
                  </div>

                  {/* Extracted Text */}
                  {verificationResult.extracted_text && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-sm text-slate-700 mb-2">
                        Extracted Text from Label:
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono text-slate-600 max-h-48 overflow-y-auto">
                        {verificationResult.extracted_text}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
