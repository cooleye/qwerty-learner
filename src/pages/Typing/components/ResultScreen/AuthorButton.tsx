import kai from '@/assets/kai.jpg'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const AuthorButton = () => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip defaultOpen>
        <TooltipTrigger>
          <Avatar className="h-8 w-8 shadow-lg">
            <AvatarImage src={kai} alt="Kai" />
            <AvatarFallback>Kai</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>作者 Kai ❤️</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
