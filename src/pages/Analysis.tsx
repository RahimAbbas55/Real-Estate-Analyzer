import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const formSchema = z.object({
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code required"),
  propertyType: z.string().min(1, "Property type is required"),
  bedrooms: z.string().min(1, "Bedrooms required"),
  bathrooms: z.string().min(1, "Bathrooms required"),
  squareFootage: z.string().min(1, "Square footage required"),
  purchasePrice: z.string().min(1, "Purchase price required"),
  afterRepairValue: z.string().optional(),
  monthlyRent: z.string().min(1, "Monthly rent required"),
  annualPropertyTax: z.string().min(1, "Property tax required"),
  annualInsurance: z.string().min(1, "Insurance required"),
  hoaFees: z.string().optional(),
  additionalIncome: z.string().optional(),
  vacancyRate: z.number().min(0).max(20),
  propertyManagement: z.number().min(0).max(20),
  maintenanceReserve: z.number().min(0).max(20),
  downPayment: z.number().min(0).max(100),
  interestRate: z.string().min(1, "Interest rate required"),
  loanTerm: z.string().min(1, "Loan term required"),
});

type FormData = z.infer<typeof formSchema>;

const Analysis = () => {
  const navigate = useNavigate();
  const [vacancyRate, setVacancyRate] = useState(5);
  const [propertyManagement, setPropertyManagement] = useState(10);
  const [maintenanceReserve, setMaintenanceReserve] = useState(5);
  const [downPayment, setDownPayment] = useState(20);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vacancyRate: 5,
      propertyManagement: 10,
      maintenanceReserve: 5,
      downPayment: 20,
    },
  });

  const onSubmit = (data: FormData) => {
    // Calculate investment metrics
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

    // Store results in localStorage
    localStorage.setItem('analysisResults', JSON.stringify({
      monthlyCashFlow: monthlyCashFlow.toFixed(0),
      cocRoi: cocRoi.toFixed(1),
      capRate: capRate.toFixed(1),
      requiredInvestment: downPaymentAmount.toFixed(0),
    }));

    toast.success("Analysis complete!");
    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Property Analysis</h1>
          <p className="text-muted-foreground">
            Complete all sections to generate your investment analysis
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section A: Property Basics */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Section A: Property Basics</h2>

            <div>
              <Label htmlFor="streetAddress">Street Address <span className="text-destructive">*</span></Label>
              <Input {...register("streetAddress")} placeholder="123 Main St" />
              {errors.streetAddress && <p className="text-sm text-destructive mt-1">{errors.streetAddress.message}</p>}
            </div>

            <div>
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input {...register("city")} placeholder="San Francisco" />
              {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setValue("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                </SelectContent>
              </Select>
              {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code <span className="text-destructive">*</span></Label>
              <Input {...register("zipCode")} placeholder="94102" />
              {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>}
            </div>

            <div>
              <Label htmlFor="propertyType">Property Type <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setValue("propertyType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Single Family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Family</SelectItem>
                  <SelectItem value="multi">Multi-Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bedrooms">Bedrooms <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setValue("bedrooms", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="3" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setValue("bathrooms", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="2" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="squareFootage">Square Footage <span className="text-destructive">*</span></Label>
              <Input {...register("squareFootage")} type="number" placeholder="1500" />
            </div>
          </div>

          {/* Section B: Financial Details */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Section B: Financial Details</h2>

            <div>
              <Label htmlFor="purchasePrice">Purchase Price <span className="text-destructive">*</span></Label>
              <Input {...register("purchasePrice")} type="number" placeholder="250000" />
            </div>

            <div>
              <Label htmlFor="afterRepairValue">After Repair Value (Optional)</Label>
              <Input {...register("afterRepairValue")} type="number" placeholder="300000" />
            </div>

            <div>
              <Label htmlFor="monthlyRent">Monthly Rent <span className="text-destructive">*</span></Label>
              <Input {...register("monthlyRent")} type="number" placeholder="2000" />
            </div>

            <div>
              <Label htmlFor="annualPropertyTax">Annual Property Tax <span className="text-destructive">*</span></Label>
              <Input {...register("annualPropertyTax")} type="number" placeholder="3000" />
            </div>

            <div>
              <Label htmlFor="annualInsurance">Annual Insurance <span className="text-destructive">*</span></Label>
              <Input {...register("annualInsurance")} type="number" placeholder="1200" />
            </div>

            <div>
              <Label htmlFor="hoaFees">HOA Fees (Optional)</Label>
              <Input {...register("hoaFees")} type="number" placeholder="150" />
            </div>

            <div>
              <Label htmlFor="additionalIncome">Additional Monthly Income (Optional)</Label>
              <Input {...register("additionalIncome")} type="number" placeholder="200" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Vacancy Rate <span className="text-destructive">*</span></Label>
                <span className="text-primary font-semibold">{vacancyRate.toFixed(1)}%</span>
              </div>
              <Slider
                value={[vacancyRate]}
                onValueChange={(value) => {
                  setVacancyRate(value[0]);
                  setValue("vacancyRate", value[0]);
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
                <Label>Property Management <span className="text-destructive">*</span></Label>
                <span className="text-primary font-semibold">{propertyManagement.toFixed(1)}%</span>
              </div>
              <Slider
                value={[propertyManagement]}
                onValueChange={(value) => {
                  setPropertyManagement(value[0]);
                  setValue("propertyManagement", value[0]);
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
                <Label>Maintenance Reserve <span className="text-destructive">*</span></Label>
                <span className="text-primary font-semibold">{maintenanceReserve.toFixed(1)}%</span>
              </div>
              <Slider
                value={[maintenanceReserve]}
                onValueChange={(value) => {
                  setMaintenanceReserve(value[0]);
                  setValue("maintenanceReserve", value[0]);
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

          {/* Section C: Financing */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Section C: Financing</h2>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Down Payment <span className="text-destructive">*</span></Label>
                <span className="text-primary font-semibold">{downPayment}%</span>
              </div>
              <Slider
                value={[downPayment]}
                onValueChange={(value) => {
                  setDownPayment(value[0]);
                  setValue("downPayment", value[0]);
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
              <Label htmlFor="interestRate">Interest Rate <span className="text-destructive">*</span></Label>
              <Input {...register("interestRate")} type="number" step="0.1" placeholder="7" />
            </div>

            <div>
              <Label htmlFor="loanTerm">Loan Term <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setValue("loanTerm", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="30 years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section D: Documentation */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Section D: Documentation</h2>

            <div>
              <Label>Property Photos <span className="text-destructive">*</span></Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-muted-foreground">Choose Files (0/75)</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Inspection Reports</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-muted-foreground">Choose Files (0/5)</span>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-lg font-semibold">
            Generate Analysis
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default Analysis;
