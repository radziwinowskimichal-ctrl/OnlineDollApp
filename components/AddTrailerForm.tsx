"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";

// 1. Zod Schema
const trailerFormSchema = z.object({
  licensePlate: z
    .string()
    .min(3)
    .transform((val) => val.toUpperCase()),
  category: z.enum(["STANDARD", "CABLE_DRUM"]),
  brandModel: z.string().min(1),
  totalWeightKg: z.number().min(1),
  payloadKg: z.number().min(1),
  dimensions: z.string().min(1),
  vin: z.string().min(1).regex(/^[A-Z0-9]+$/i),
  tuevExpiryDate: z.date(),
}).refine((data) => data.payloadKg < data.totalWeightKg, {
  path: ["payloadKg"],
});

type TrailerFormValues = z.infer<typeof trailerFormSchema>;

export function AddTrailerForm() {
  const { language } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const [activeTab, setActiveTab] = useState("basic");

  // 2. Form Setup
  const form = useForm<TrailerFormValues>({
    resolver: zodResolver(trailerFormSchema),
    defaultValues: {
      licensePlate: "",
      category: "STANDARD",
      brandModel: "",
      totalWeightKg: 0,
      payloadKg: 0,
      dimensions: "",
      vin: "",
    },
  });

  async function onSubmit(data: TrailerFormValues) {
    console.log("Form Data Submitted:", data);
    toast.success(
      language === "pl"
        ? "Przyczepa została pomyślnie dodana!"
        : language === "de"
        ? "Anhänger erfolgreich hinzugefügt!"
        : "Trailer successfully added!",
      {
        description: `Kennzeichen: ${data.licensePlate}`,
        id: "add-trailer-success",
      }
    );
    form.reset();
    setActiveTab("basic");
  }

  // Helper to validate current tab before moving next
  const validateTab = async (tab: string) => {
    let fields: (keyof TrailerFormValues)[] = [];
    if (tab === "basic") {
      fields = ["licensePlate", "category", "brandModel"];
    } else if (tab === "tech") {
      fields = ["totalWeightKg", "payloadKg", "dimensions"];
    }

    const isValid = await form.trigger(fields);
    return isValid;
  };

  const handleNext = async (currentTab: string, nextTab: string) => {
    const isValid = await validateTab(currentTab);
    if (isValid) {
      setActiveTab(nextTab);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">{t.addNewTrailer}</CardTitle>
        <CardDescription>
          {language === "pl"
            ? "Wprowadź dane nowej przyczepy do bazy wypożyczalni."
            : language === "de"
            ? "Geben Sie die Daten des neuen Anhängers in das System ein."
            : "Enter details for the new trailer into the system."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="basic">{language === "pl" ? "Tożsamość" : language === "de" ? "Identität" : "Identity"}</TabsTrigger>
                <TabsTrigger value="tech">{language === "pl" ? "Specyfikacja" : language === "de" ? "Spezifikation" : "Specs"}</TabsTrigger>
                <TabsTrigger value="compliance">{language === "pl" ? "Zgodność" : language === "de" ? "Konformität" : "Compliance"}</TabsTrigger>
              </TabsList>

              {/* Tab 1: Identity */}
              <TabsContent value="basic" className="space-y-4 animate-in fade-in-50 duration-500">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.plate}</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. B-TR 2024" {...field} className="uppercase font-mono" />
                        </FormControl>
                        <FormDescription>
                          {language === "pl"
                            ? "Unikalny numer rejestracyjny."
                            : language === "de"
                            ? "Eindeutiges amtliches Kennzeichen."
                            : "Unique registration plate number."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.type}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={language === "pl" ? "Wybierz kategorię" : language === "de" ? "Kategorie wählen" : "Select category"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STANDARD">{language === "pl" ? "Przyczepa standardowa" : language === "de" ? "Standardanhänger" : "Standard trailer"}</SelectItem>
                            <SelectItem value="CABLE_DRUM">{language === "pl" ? "Przyczepa kablowa / bębnowa" : language === "de" ? "Kabeltrommelanhänger" : "Cable drum trailer"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.model}</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Humbaur HK 132513" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => handleNext("basic", "tech")} className="gap-2">
                    {language === "pl" ? "Dalej" : language === "de" ? "Weiter" : "Next"} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Tab 2: Technical Specs */}
              <TabsContent value="tech" className="space-y-4 animate-in fade-in-50 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "pl" ? "DMC (kg)" : language === "de" ? "Gesamtgewicht (kg)" : "GVW (kg)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payloadKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "pl" ? "Ładowność (kg)" : language === "de" ? "Nutzlast (kg)" : "Payload (kg)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "pl" ? "Wymiary" : language === "de" ? "Maße (L x B x H)" : "Dimensions (L x W x H)"}</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 3.00 x 1.50 x 2.00m" {...field} />
                      </FormControl>
                      <FormDescription>
                        {language === "pl"
                          ? "Długość x szerokość x wysokość."
                          : language === "de"
                          ? "Länge x Breite x Höhe."
                          : "Length x width x height."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("basic")} className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> {language === "pl" ? "Wstecz" : language === "de" ? "Zurück" : "Back"}
                  </Button>
                  <Button type="button" onClick={() => handleNext("tech", "compliance")} className="gap-2">
                    {language === "pl" ? "Dalej" : language === "de" ? "Weiter" : "Next"} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Tab 3: Compliance */}
              <TabsContent value="compliance" className="space-y-4 animate-in fade-in-50 duration-500">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.vin}</FormLabel>
                        <FormControl>
                          <Input placeholder="WP0ZZZ..." {...field} className="uppercase font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tuevExpiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t.tuevExpiry}</FormLabel>
                        <Popover>
                          <PopoverTrigger>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>{t.pickADate}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("tech")} className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> {language === "pl" ? "Wstecz" : language === "de" ? "Zurück" : "Back"}
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {t.addNewTrailer}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
