import {
  Cog6ToothIcon,
  CubeIcon,
  PlusIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useContext } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../ui/Listbox";
import { Divider } from "../ui/Divider";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { setShowDialog, setDialogMessage } from "../../redux/slices/uiSlice";
import { AddModelForm } from "../../forms/AddModelForm";

function modelSelectTitle(model: any): string {
  if (model?.title) return model?.title;
  if (model?.model !== undefined && model?.model.trim() !== "") {
    if (model?.class_name) {
      return `${model?.class_name} - ${model?.model}`;
    }
    return model?.model;
  }
  return model?.class_name;
}

export function ModelSelectDropdown() {
  const ideMessenger = useContext(IdeMessengerContext);
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const allModels = config.modelsByRole.chat || [];
  const defaultSelectedModel = config.selectedModelByRole.chat;
  
  const [selectedModelValue, setSelectedModelValue] = useState(
    modelSelectTitle(defaultSelectedModel) || "Select model"
  );

  useEffect(() => {
    if (defaultSelectedModel) {
      setSelectedModelValue(modelSelectTitle(defaultSelectedModel));
    }
  }, [defaultSelectedModel]);

  // Combine actual models from state with the mockup's visual elements
  const options = allModels.length > 0 ? allModels.map(m => ({
    title: modelSelectTitle(m),
    value: modelSelectTitle(m),
    autodetected: m.isFromAutoDetect || false
  })) : [
    { title: "qwen3:8b", value: "qwen3:8b", autodetected: true },
  ];

  const handleSelect = (val: string) => {
    setSelectedModelValue(val);
    // Ideally we would dispatch updateSelectedModelByRole here, 
    // but since it's not present in Release 1, we just post to IDE or keep local state.
    ideMessenger.post("config/updateSelectedModel", { role: "chat", modelTitle: val });
  };

  return (
    <Listbox value={selectedModelValue} onChange={handleSelect}>
      <ListboxButton className="border-none bg-transparent hover:bg-transparent shadow-none px-1 py-0 hover:brightness-125 flex items-center gap-1 cursor-pointer">
        <span className="text-xs text-vsc-foreground">{selectedModelValue}</span>
        <ChevronDownIcon className="h-3 w-3 text-vsc-foreground" />
      </ListboxButton>
      <ListboxOptions
        anchor="top start"
        className="w-64 max-h-80 bg-vsc-background border border-vsc-commandCenter-inactiveBorder rounded-md overflow-y-auto mb-1"
      >
        <div className="flex justify-between items-center px-3 py-2 border-b border-vsc-commandCenter-inactiveBorder">
          <span className="text-xs font-semibold">Models</span>
          <Cog6ToothIcon className="h-3.5 w-3.5 cursor-pointer hover:brightness-125" />
        </div>
        {options.map((model, idx) => (
          <ListboxOption
            key={idx}
            value={model.value}
            className={`cursor-pointer px-3 py-1.5 flex items-center gap-2 hover:bg-list-active hover:text-list-active-foreground ${selectedModelValue === model.value ? "bg-list-active text-list-active-foreground" : ""}`}
          >
            <CubeIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <div className="flex-1 truncate text-xs">
              {model.title}
              {model.autodetected && (
                <span className="text-[10px] text-gray-500 italic ml-1">(autodetected)</span>
              )}
            </div>
          </ListboxOption>
        ))}
        <Divider className="my-1" />
        <div 
          onClick={(e) => {
            e.stopPropagation();
            dispatch(setShowDialog(true));
            dispatch(setDialogMessage(<AddModelForm onDone={() => dispatch(setShowDialog(false))} />));
          }}
          className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-list-active hover:text-list-active-foreground"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="text-xs">Add Chat model</span>
        </div>
      </ListboxOptions>
    </Listbox>
  );
}
