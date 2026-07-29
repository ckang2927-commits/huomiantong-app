import logoUrl from '../assets/huomiantong-logo.png'

type AppLogoProps = {
  className?: string
  title?: string
}

export function AppLogo({ className, title = '获面通 Logo' }: AppLogoProps): JSX.Element {
  return <img alt={title} className={className} draggable={false} src={logoUrl} />
}
