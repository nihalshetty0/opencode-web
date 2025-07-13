import { useGetProviders } from "@/hooks/fetch/providers";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { CheckIcon } from "lucide-react";
import { ChevronsUpDownIcon } from "lucide-react";
import { useSelectedModelStore } from "@/store";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function ProviderSelect() {
  const { data: providers } = useGetProviders();

  const setSelectedModel = useSelectedModelStore((s) => s.setSelectedModel);
  const selectedModel = useSelectedModelStore((s) => s.selectedModel);

  // TODO: Refactor
  useEffect(() => {
    if (selectedModel === null && providers?.default) {
      setSelectedModel({
        providerID: Object.keys(providers.default)[0],
        modelID: providers.default[Object.keys(providers.default)[0]],
      });
    }
  }, [providers]);

  const modelList = useMemo(() => {
    if (!providers?.providers) return [];
    return providers.providers.flatMap((provider) =>
      Object.keys(provider.models).map((model) => ({
        providerID: provider.id,
        modelID: model,
        name: provider.models[model].name,
      }))
    );
  }, [providers]);

  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className=" justify-between"
        >
          {selectedModel?.modelID
            ? modelList.find((model) => model.modelID === selectedModel.modelID)
                ?.name
            : "Select model..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" p-0" align="start">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {modelList.map((model) => (
                <CommandItem
                  key={model.modelID}
                  value={model.modelID}
                  onSelect={(currentValue) => {
                    setSelectedModel({
                      providerID:
                        modelList.find(
                          (model) => model.modelID === currentValue
                        )?.providerID ?? "",
                      modelID: currentValue,
                    });
                    setPopoverOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModel?.modelID === model.modelID
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
