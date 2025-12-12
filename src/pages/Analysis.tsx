import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import BottomNav from "@/components/BottomNav";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { X, File, Image, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  streetAddress: z.string().nonempty("Street address is required"),
  city: z.string().nonempty("City is required"),
  state: z.string().nonempty("State is required"),
  zipCode: z.string().min(3, "Valid ZIP code required"),
  propertyType: z.string().nonempty("Property type is required"),
  bedrooms: z.string().nonempty("Bedrooms required"),
  bathrooms: z.string().nonempty("Bathrooms required"),
  squareFootage: z.string().nonempty("Square footage required"),
  purchasePrice: z.string().nonempty("Purchase price required"),
  afterRepairValue: z.string().optional(),
  monthlyRent: z.string().nonempty("Monthly rent required"),
  annualPropertyTax: z.string().nonempty("Property tax required"),
  annualInsurance: z.string().nonempty("Insurance required"),
  hoaFees: z.string().optional(),
  additionalIncome: z.string().optional(),
  vacancyRate: z.number().min(0).max(20),
  propertyManagement: z.number().min(0).max(20),
  maintenanceReserve: z.number().min(0).max(20),
  downPayment: z.number().min(0).max(100),
  interestRate: z.string().nonempty("Interest rate required"),
  loanTerm: z.string().nonempty("Loan term required"),
});

type FormData = z.infer<typeof formSchema>;

const Analysis: React.FC = () => {
  const navigate = useNavigate();

  const [vacancyRate, setVacancyRate] = useState<number>(5);
  const [propertyManagement, setPropertyManagement] = useState<number>(10);
  const [maintenanceReserve, setMaintenanceReserve] = useState<number>(5);
  const [downPayment, setDownPayment] = useState<number>(20);

  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
  const [inspectionReports, setInspectionReports] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const reportInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vacancyRate: 5,
      propertyManagement: 10,
      maintenanceReserve: 5,
      downPayment: 20,
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      squareFootage: "",
      purchasePrice: "",
      afterRepairValue: "",
      monthlyRent: "",
      annualPropertyTax: "",
      annualInsurance: "",
      hoaFees: "",
      additionalIncome: "",
      interestRate: "",
      loanTerm: "",
    } as Partial<FormData>,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (propertyPhotos.length + imageFiles.length > 75) {
      toast.error("Maximum 75 photos allowed");
      return;
    }

    // per-file limit: 12MB for images
    const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
    const filtered = imageFiles.filter((f) => {
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is too large (max 12MB)`);
        return false;
      }
      return true;
    });

    setPropertyPhotos((prev) => [...prev, ...filtered]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (inspectionReports.length + files.length > 5) {
      toast.error("Maximum 5 inspection reports allowed");
      return;
    }

    // per-file limit: 25MB for reports (pdf/docs)
    const MAX_REPORT_BYTES = 25 * 1024 * 1024;
    const filtered = files.filter((f) => {
      if (f.size > MAX_REPORT_BYTES) {
        toast.error(`${f.name} is too large (max 25MB)`);
        return false;
      }
      return true;
    });

    setInspectionReports((prev) => [...prev, ...filtered]);
    if (reportInputRef.current) reportInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPropertyPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeReport = (index: number) => {
    setInspectionReports((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const uploadInBatches = async (
    files: File[],
    fieldName: string,
    batchSize = 10,
    url = "https://rahimdemo.app.n8n.cloud/webhook/upload-data"
  ) => {
    const batches: File[][] = [];
    for (let i = 0; i < files.length; i += batchSize)
      batches.push(files.slice(i, i + batchSize));

    for (let i = 0; i < batches.length; i++) {
      const formData = new FormData();
      batches[i].forEach((file) => formData.append(fieldName, file, file.name));

      // upload with basic retry logic per batch
      const maxAttempts = 3;
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          // be explicit about a slightly longer timeout so larger batches don't fail immediately
          await axios.post(url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 2 * 60 * 1000, // 2 minutes per batch
          });
          break; // success
        } catch (err) {
          attempt += 1;
          if (attempt >= maxAttempts) throw err;
        }
      }
    }
  };

  // a small snapshot used to avoid re-uploading the same files during final submit
  const [uploadSnapshot, setUploadSnapshot] = useState({
    photos: 0,
    reports: 0,
  });

  const handleUploadToDrive = async () => {
    if (propertyPhotos.length === 0 && inspectionReports.length === 0) {
      toast.error("Please add at least one file to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos in batches to avoid sending huge single request which can cause a frontend timeout
      if (propertyPhotos.length)
        await uploadInBatches(propertyPhotos, "data", 8);
      if (inspectionReports.length)
        await uploadInBatches(inspectionReports, "reports", 5);

      // record snapshot so we don't re-upload unchanged assets on final submit
      setUploadSnapshot({
        photos: propertyPhotos.length,
        reports: inspectionReports.length,
      });

      toast.success(
        "Files uploaded to Drive successfully (uploaded in batches)"
      );
    } catch (error) {
      console.error("Failed to upload files:", error);
      toast.error("Failed to upload files to Drive");
    } finally {
      setIsUploading(false);
    }
  };

  const fieldsStep1: (keyof FormData)[] = [
    "streetAddress",
    "city",
    "state",
    "zipCode",
    "propertyType",
    "bedrooms",
    "bathrooms",
    "squareFootage",
  ];

  const fieldsStep2: (keyof FormData)[] = [
    "purchasePrice",
    "monthlyRent",
    "annualPropertyTax",
    "annualInsurance",
    "vacancyRate",
    "propertyManagement",
    "maintenanceReserve",
    "downPayment",
    "interestRate",
    "loanTerm",
  ];

  const onSubmit = async (data: FormData) => {
  if (propertyPhotos.length === 0) {
    toast.error("Please upload at least one property photo");
    setCurrentStep(3);
    return;
  }

  try {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const purchasePrice = parseFloat(data.purchasePrice);
    const monthlyRent = parseFloat(data.monthlyRent);
    const annualTax = parseFloat(data.annualPropertyTax);
    const annualInsurance = parseFloat(data.annualInsurance);
    const downPaymentAmount = (purchasePrice * data.downPayment) / 100;

    const annualRent = monthlyRent * 12;
    const vacancyLoss = annualRent * (data.vacancyRate / 100);
    const managementCost = annualRent * (data.propertyManagement / 100);
    const maintenanceCost = annualRent * (data.maintenanceReserve / 100);

    const annualExpenses = annualTax + annualInsurance + vacancyLoss + managementCost + maintenanceCost;
    const noi = annualRent - annualExpenses;
    const monthlyCashFlow = noi / 12;
    const cocRoi = (noi / downPaymentAmount) * 100;
    const capRate = (noi / purchasePrice) * 100;

    const formData = new FormData();

    // Add user info
    formData.append("userId", user.id);
    formData.append("userEmail", user.email || "");

    // Add all form fields
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    formData.append("monthlyCashFlow", monthlyCashFlow.toFixed(0));
    formData.append("cocRoi", cocRoi.toFixed(1));
    formData.append("capRate", capRate.toFixed(1));
    formData.append("requiredInvestment", downPaymentAmount.toFixed(0));

    // ✅ Add all photos directly
    propertyPhotos.forEach((file) => {
      formData.append("data", file, file.name);
    });

    // ✅ Add all reports directly
    inspectionReports.forEach((file) => {
      formData.append("reports", file, file.name);
    });

    toast.loading(
      `Processing ${propertyPhotos.length} images in batches. This may take 5-15 minutes...`, 
      { 
        duration: Infinity,
        id: 'processing' 
      }
    );

    // ✅ Send everything in ONE request
    const response = await axios.post(
      "https://rahimdemo.app.n8n.cloud/webhook/property-analyzer", 
      formData, 
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20 * 60 * 1000, // 20 minutes
      }
    );

    toast.dismiss('processing');
    console.log(JSON.stringify(response.data));
      sessionStorage.setItem("analysisResults", JSON.stringify(response.data));

      // also append to localStorage analysisList for history
      try {
        const existing = JSON.parse(localStorage.getItem("analysisList") || "[]");
        const entry = {
          id: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          content: response.data,
        };
        existing.unshift(entry);
        // keep only latest 50
        localStorage.setItem("analysisList", JSON.stringify(existing.slice(0, 50)));
      } catch (err) {
        console.warn("Failed to append analysis to localStorage", err);
      }

      toast.success("Analysis complete!");

      setTimeout(() => navigate("/results"), 60000); // Redirect after 1 minute

  } catch (error) {
    toast.dismiss('processing');
    console.error("Failed to send data:", error);
    toast.error("Failed to complete analysis");
  }
};

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Property Analysis
          </h1>
          <p className="text-muted-foreground">
            Complete all sections to generate your investment analysis
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Steps header */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <div>Step {currentStep} of 4</div>
              <div className="font-medium">
                {currentStep === 1
                  ? "Property"
                  : currentStep === 2
                  ? "Financial"
                  : currentStep === 3
                  ? "Photos"
                  : "Reports"}
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-primary transition-all"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 w-full max-w-2xl justify-between">
              {["Property", "Financial", "Photos", "Reports"].map(
                (label, idx) => (
                  <div
                    key={label}
                    className={`flex-1 text-center py-2 rounded-md border ${
                      currentStep === idx + 1
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {idx + 1}. {label}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Section A: Property Basics (Step 1) */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Section A: Property Basics
              </h2>

              <div>
                <Label htmlFor="streetAddress">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="streetAddress"
                  {...register("streetAddress")}
                  placeholder="123 Main St"
                />
                {errors.streetAddress && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.streetAddress.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="San Francisco"
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("state", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="zipCode">
                  ZIP Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zipCode"
                  {...register("zipCode")}
                  placeholder="94102"
                />
                {errors.zipCode && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.zipCode.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="propertyType">
                  Property Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("propertyType", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Single Family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Family</SelectItem>
                    <SelectItem value="multi">Multi-Family</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.propertyType.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bedrooms">
                  Bedrooms <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("bedrooms", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="3" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bedrooms && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.bedrooms.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bathrooms">
                  Bathrooms <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("bathrooms", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="2" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bathrooms && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.bathrooms.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="squareFootage">
                  Square Footage <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="squareFootage"
                  {...register("squareFootage")}
                  type="number"
                  placeholder="1500"
                />
                {errors.squareFootage && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.squareFootage.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section B + C: Financial Details and Financing (Step 2) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Section B: Financial Details
              </h2>

              <div>
                <Label htmlFor="purchasePrice">
                  Purchase Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchasePrice"
                  {...register("purchasePrice")}
                  type="number"
                  placeholder="250000"
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.purchasePrice.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="afterRepairValue">
                  After Repair Value (Optional)
                </Label>
                <Input
                  id="afterRepairValue"
                  {...register("afterRepairValue")}
                  type="number"
                  placeholder="300000"
                />
              </div>

              <div>
                <Label htmlFor="monthlyRent">
                  Monthly Rent <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="monthlyRent"
                  {...register("monthlyRent")}
                  type="number"
                  placeholder="2000"
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.monthlyRent.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="annualPropertyTax">
                  Annual Property Tax{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="annualPropertyTax"
                  {...register("annualPropertyTax")}
                  type="number"
                  placeholder="3000"
                />
                {errors.annualPropertyTax && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.annualPropertyTax.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="annualInsurance">
                  Annual Insurance <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="annualInsurance"
                  {...register("annualInsurance")}
                  type="number"
                  placeholder="1200"
                />
                {errors.annualInsurance && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.annualInsurance.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="hoaFees">HOA Fees (Optional)</Label>
                <Input
                  id="hoaFees"
                  {...register("hoaFees")}
                  type="number"
                  placeholder="150"
                />
              </div>

              <div>
                <Label htmlFor="additionalIncome">
                  Additional Monthly Income (Optional)
                </Label>
                <Input
                  id="additionalIncome"
                  {...register("additionalIncome")}
                  type="number"
                  placeholder="200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    Vacancy Rate <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-primary font-semibold">
                    {vacancyRate.toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[vacancyRate]}
                  onValueChange={(val) => {
                    setVacancyRate(val[0]);
                    setValue("vacancyRate", val[0], {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    Property Management{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-primary font-semibold">
                    {propertyManagement.toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[propertyManagement]}
                  onValueChange={(val) => {
                    setPropertyManagement(val[0]);
                    setValue("propertyManagement", val[0], {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    Maintenance Reserve{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-primary font-semibold">
                    {maintenanceReserve.toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[maintenanceReserve]}
                  onValueChange={(val) => {
                    setMaintenanceReserve(val[0]);
                    setValue("maintenanceReserve", val[0], {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          )}

          {/* Section C: Financing (still part of Step 2) - shown in same step */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Section C: Financing
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    Down Payment <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-primary font-semibold">
                    {downPayment}%
                  </span>
                </div>
                <Slider
                  value={[downPayment]}
                  onValueChange={(val) => {
                    setDownPayment(val[0]);
                    setValue("downPayment", val[0], {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <Label htmlFor="interestRate">
                  Interest Rate (annual %){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="interestRate"
                  {...register("interestRate")}
                  type="number"
                  step="0.01"
                  placeholder="7.00"
                />
                {errors.interestRate && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.interestRate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="loanTerm">
                  Loan Term <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("loanTerm", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="30 years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="20">20 years</SelectItem>
                    <SelectItem value="30">30 years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.loanTerm && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.loanTerm.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section D: Property Photos (Step 3) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Section D: Documentation
              </h2>

              <div>
                <Label>
                  Property Photos <span className="text-destructive">*</span>
                </Label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-muted-foreground">
                      Choose Files ({propertyPhotos.length}/75)
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Images only
                    </span>
                  </div>
                </div>

                {propertyPhotos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {propertyPhotos.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Image className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhoto(index)}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* photos-only step: reports moved to step 4 */}

              {/* Only photos portion was here originally; we've moved reports and final actions into step 4 */}
            </div>
          )}

          {/* Step 4 - Reports + final actions (optional reports) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Step 4: Optional Reports & Submit
              </h2>

              <div>
                <Label>Inspection Reports</Label>
                <input
                  ref={reportInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleReportChange}
                  className="hidden"
                />
                <div
                  onClick={() => reportInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-muted-foreground mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-muted-foreground">
                      Choose Files ({inspectionReports.length}/5)
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, TXT
                    </span>
                  </div>
                </div>

                {inspectionReports.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {inspectionReports.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReport(index)}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Generating..." : "Generate Analysis"}
                </Button>
              </div>
            </div>
          )}

          {/* step navigation */}
          <div className="flex gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 && (
              <Button
                type="button"
                className="ml-auto"
                onClick={async () => {
                  // advance with validation per step
                  if (currentStep === 1) {
                    const ok = await trigger(fieldsStep1);
                    if (ok) setCurrentStep(2);
                    else
                      toast.error(
                        "Please fill required fields in property details"
                      );
                  } else if (currentStep === 2) {
                    const ok = await trigger(fieldsStep2);
                    if (ok) setCurrentStep(3);
                    else
                      toast.error(
                        "Please fill required fields in financials/financing"
                      );
                  } else if (currentStep === 3) {
                    if (propertyPhotos.length === 0) {
                      toast.error("Please upload at least one property photo");
                      return;
                    }
                    setCurrentStep(4);
                  }
                }}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </div>
      <BottomNav />
    </Layout>
  );
};

export default Analysis;
