import { useEffect, useMemo, useState } from "react"
import { useSelectedModelStore } from "@/store"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useGetProviders } from "@/hooks/fetch/providers"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ProviderSelect() {
  const { data: providers } = useGetProviders()

  const setSelectedModel = useSelectedModelStore((s) => s.setSelectedModel)
  const selectedModel = useSelectedModelStore((s) => s.selectedModel)
  const recentModels = useSelectedModelStore((s) => s.recent)

  // TODO: Refactor
  useEffect(() => {
    if (selectedModel === null && providers?.default) {
      setSelectedModel({
        providerID: Object.keys(providers.default)[0],
        modelID: providers.default[Object.keys(providers.default)[0]],
      })
    }
  }, [providers])

  const modelList = useMemo(() => {
    if (!providers?.providers) return []
    return providers.providers.flatMap((provider) =>
      Object.keys(provider.models).map((model) => ({
        providerID: provider.id,
        modelID: model,
        name: provider.models[model].name,
      }))
    )
  }, [providers])

  const [popoverOpen, setPopoverOpen] = useState(false)

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
          <CommandInput placeholder="Search model..." />
          <CommandList>
            {/* TODO: add a guide on how to add a model */}
            <CommandEmpty>No model found.</CommandEmpty>
            {recentModels.length > 0 && (
              <CommandGroup heading="Recent">
                {recentModels.map((model) => {
                  const displayName =
                    modelList.find((m) => m.modelID === model.modelID)?.name ||
                    model.modelID
                  return (
                    <CommandItem
                      key={`recent-${model.providerID}:${model.modelID}:recent`}
                      value={`recent:${model.providerID}:${model.modelID}`}
                      onSelect={() => {
                        setSelectedModel(model)
                        setPopoverOpen(false)
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
                      {displayName}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {providers?.providers?.map((provider) => (
              <CommandGroup key={provider.id} heading={provider.id}>
                {Object.keys(provider.models).map((modelId) => {
                  const info = provider.models[modelId]
                  return (
                    <CommandItem
                      key={`${provider.id}:${modelId}`}
                      value={`${provider.id}:${modelId}`}
                      onSelect={(currentValue) => {
                        const parts = currentValue.split(":")
                        const modelId = parts.pop() ?? currentValue
                        const providerId = parts.pop() ?? provider.id
                        setSelectedModel({
                          providerID: providerId,
                          modelID: modelId,
                        })
                        setPopoverOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedModel?.modelID === modelId
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {info.name}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
