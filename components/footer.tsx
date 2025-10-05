import Link from "next/link"

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <span>&copy; {currentYear} Archer Fitness. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>
                Created by{" "}
                <a href="https://antonioarcher.com" className="font-medium hover:text-primary" target="_blank" rel="noreferrer">
                    Antonio Archer
                </a>
            </span>
            <span className="hidden sm:inline">•</span>
            <Link href="/privacy" className="hover:text-primary">
                Privacy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="hover:text-primary">
                Terms
            </Link>
            <span className="hidden sm:inline">•</span>
            <a href="https://github.com/ad-archer/archer-fitness" className="hover:text-primary" target="_blank" rel="noreferrer">
                GitHub
            </a>
        </div>
    )
}

export default Footer