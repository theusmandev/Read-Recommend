import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { fetchFeed, fetchLeaderboard } from "@/lib/community";
import { BookHeart, Menu, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Home", external: false },
  { to: "/browse", label: "Browse", external: false },
  { to: "/leaderboard", label: "Readers' Choice", external: false },
  { to: "/submit", label: "Recommend", external: false },
  { to: "/my-recommendations", label: "My Recommendations", external: false },
] as const;

const externalNavItem = {
  href: "https://smart.urdunovelbanks.com/",
  label: "Search Novels",
};

/* ── Consistent filled-glyph SVG icons (no enclosing circles) ── */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.079 1.372.157v3.318a8.7 8.7 0 00-.879-.028c-1.246 0-1.729.473-1.729 1.702v2.409h2.457l-.423 3.667h-2.034v8.15A11.999 11.999 0 0012.001 24a12.07 12.07 0 01-2.9-.309z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.6 8.6 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345c-.091.379-.293 1.194-.333 1.361-.053.218-.174.265-.402.16-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

function UrduNovelBankLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="120 615 1010 400"
      role="img"
      aria-labelledby="unb-footer-logo-title"
      className={className ?? "w-40 sm:w-48 md:w-52 h-auto block mx-auto"}
    >
      <title id="unb-footer-logo-title">اردو ناول بینک</title>
      <defs>
        <linearGradient id="unb-urdu-grad" gradientUnits="userSpaceOnUse" x1="1090" y1="610" x2="150" y2="890">
          <stop offset="0" stopColor="#a95a14" />
          <stop offset="0.55" stopColor="#8a400a" />
          <stop offset="1" stopColor="#6d3007" />
        </linearGradient>
        <linearGradient id="unb-ink-grad" gradientUnits="userSpaceOnUse" x1="290" y1="0" x2="1040" y2="0">
          <stop offset="0" stopColor="#6b2f09" />
          <stop offset="1" stopColor="#5a2607" />
        </linearGradient>
      </defs>

      <g transform="translate(0 22)">
        <g transform="translate(4.5 0)">
          <g fill="url(#unb-urdu-grad)">
            <path fillRule="evenodd" d="M251.3 727.3C251 727.5 251.3 727.9 251.1 728.2C250.1 729.4 245.9 729.8 244.4 730.3C239 732 233.8 734 228.9 736.7C236.4 735.6 243.6 733 251.2 732C251 732.1 251.5 732.5 251.3 732.8C250.9 733.5 244.9 734.8 243.7 735.2C237.4 737.3 231.3 740 225.3 742.9C203 754 178.2 772.7 172.3 798.3C167.3 820.3 189.5 831.2 207.7 834C245.2 839.7 284.5 834.3 317.9 815.5C327.8 809.9 340 801.5 344.5 790.5C348.2 781.3 346.4 763.1 346.8 752.7C347.6 732 350.2 711.2 361.1 693.1C374.8 670.3 399.3 661.1 422.8 651.7C436.1 646.4 449.3 640.9 462.7 635.7C474.7 630.9 486.4 625.1 498.1 619.4C499.7 618.7 507.6 613.6 508.5 613.5C508.8 613.5 509 614 509.3 613.9C508.9 614.4 506.6 617.5 507 618.1C507.6 619 509.3 618 508.2 619.8C502.6 628.9 489.4 638.4 480.4 644C461.9 655.6 441.5 664.8 421.5 673.6C406 680.5 376.5 691.5 365.9 704.4C365 705.6 363.6 707.1 362.9 708.3C362.3 709.3 362.1 731.3 362.1 734.3C362 744.3 362.1 754.2 362 764.3C361.9 783.2 359.6 810.2 384.1 814.6C389.8 815.6 395.5 814.5 400.9 813.1C411.6 810.2 420.5 802.7 427.5 794.3C430.4 790.8 433.1 786.7 437 784.2C438.9 782.9 441.2 782.2 443.4 781.3C446.2 769.7 447.2 760.7 456.3 752C456.4 752.3 456.9 752.4 457 752.7C457 752.9 457.8 759 457.9 759.6C458.1 764.4 458 768.7 460.2 773.2C467 787.6 484.9 789.4 496.6 779.8C504.1 773.6 505.8 762.8 512.1 755.7C512.2 756 512.7 756 512.9 756.2C515.3 760.2 511.8 766.2 515.6 771.7C517.4 774.3 520 775.5 523.1 776.1C536.5 778.8 543.1 763.8 549.1 755C549.2 755.3 549.7 755 550 755.2C552 757.3 547.6 770.7 546.8 773.6C542.7 787.7 525.6 819.7 507.1 803.9C504.5 801.7 504.5 799.3 502.8 797.3C502.7 797.1 502.2 797.2 502 796.9C492.2 811.1 478 830.1 458.2 819.4C453.5 816.8 449.9 812.4 447.9 807.5C447.2 805.7 447 803.5 445.8 801.9C444.8 800.5 442.6 800.7 441.2 801.3C433.9 804.1 428.3 816.4 423.8 822.7C411.5 840 392.1 857.8 369.2 851C361.2 848.6 355.5 842.7 352 835.3C348.9 828.6 348.1 821.3 346.7 814.2C346.5 814.4 346.1 814.3 345.9 814.5C344.5 815.6 340 823.1 338.4 825.1C333.5 831.5 327.9 837.2 321.8 842.4C293.8 866.2 255.5 878.1 219 877.7C197.8 877.5 173 872.9 159.3 855.2C146 838 147.6 814.3 155.5 795.2C168.7 763.7 197.1 744 228.3 732.8C231.5 731.7 248.1 726.5 250.4 726.8C250.8 726.9 251 727.3 251.3 727.3ZM586.7 759.6C586.7 759.9 587.3 759.9 587.4 760.2C587.5 761.2 585.8 761.7 586.2 762.9C586.7 764.2 587.4 762.8 587 764.5C586.3 767.3 582.4 772 580.9 774.8C578.6 778.8 576.7 783.1 574.9 787.4C569.3 800.4 565.7 815.1 566.3 829.2C568.4 875.8 623.1 870.5 650.4 849.8C662.3 840.9 672.8 829.2 678.5 815.3C687.4 793.8 683.8 762.9 682.1 740C681.4 730 681 720 680.5 710C679.3 684.2 679 667.3 692.9 644.6C696.8 638.3 700.7 632 706.5 627.7C708.1 634.5 705.5 642.1 704.9 649.2C703.9 662.5 703.9 675.9 703.9 689.2C704.1 748.3 705 800.3 673 852.8C655.6 881.3 627.5 905.1 592.7 904.2C566.5 903.6 550.1 882.1 548.8 857.3C547.1 823.9 561.2 782 586.7 759.6ZM1066.8 848.6C1067.2 842.5 1068.7 836.1 1069.6 829.9C1071.3 819.4 1071.4 808.6 1071.5 798C1071.8 782.7 1071.6 767.2 1070.9 751.9C1070.4 739.6 1069.6 726.1 1072.1 713.9C1073.6 706.8 1085.7 680.4 1091.6 677.1C1091.9 677 1092.3 677.2 1092.6 677C1093.3 683.3 1092 690.2 1091.8 696.8C1091.4 706.8 1091.6 716.8 1091.6 726.8C1091.6 752.9 1094.4 785.7 1086.3 810.4C1083 820.6 1079.5 830.6 1074 839.8C1073.1 841.2 1068.8 848.5 1067.7 848.8C1067.4 848.9 1067 848.4 1066.8 848.6ZM808.3 683.5C808.4 683.9 808.7 686.9 808.9 687.1C809.6 688 809.9 687.1 810.1 688.5C810.5 691.2 809.2 694.7 808.9 697.4C807.9 704.6 807.3 712 806.8 719.3C805.2 747.2 801.6 775.2 802 803.1C802.2 813.6 804.4 826.8 815.3 831.1C819.4 832.8 823.9 832.5 827.9 830.6C839.5 825 838 813.1 844.8 804.4C848.7 799.5 842.3 807.6 846.5 803.7C848.4 822.7 840.9 847.5 828.8 862.5C820.6 872.8 805.7 876.3 795.8 866.1C784 854.1 785.1 829 785.8 813.3C786.6 794.4 787.3 775.4 787.4 756.4C787.5 743.6 786.7 730 789.9 717.6C793.1 705.4 800.6 693.2 808.3 683.5ZM923.3 865.1C938.9 855.1 954.9 844.9 969 832.8C973.4 829 981.7 823.3 984.2 818.3C989.9 806.7 980.1 791.7 970.9 785.4C965.9 781.9 960.3 779.8 954.6 778.1C954.5 769.7 962.4 750.3 966.5 742.5C973.1 743.1 979.1 746.3 984.4 750.4C1003.7 765.3 1004.3 790.3 997.6 811.7C994 823.3 985 842.9 975.3 850.4C971.2 853.5 965.2 854.5 960.4 856.2C951.3 859.3 941.9 862 932.5 864C931.4 864.2 924.1 866 923.7 865.8C923.4 865.7 923.5 865.1 923.3 865.1ZM962.3 883.2C968 876.7 975.8 871.3 982.6 865.6C999.6 851.3 1015.9 835.5 1027.8 816.6C1031.9 810.1 1034.8 803 1037.5 795.8C1041.4 785.5 1043.1 774.6 1047.7 764.5C1048.9 761.8 1040.5 756.7 1053.1 755C1053.3 754.8 1053.8 754.9 1054 754.7C1054 755 1054.6 755.1 1054.7 755.4C1055.5 757.5 1051.7 780.3 1051 784.1C1046.5 807.9 1037.4 849.1 1018.6 865.5C1009.3 873.7 988.7 877.7 976.6 880.6C974.4 881.1 964.6 884.3 963 883.8C962.7 883.7 962.6 883.2 962.3 883.2ZM679.5 878.8C679.7 878.6 679.6 878.2 679.8 878C681.1 876.7 695.1 869.5 698.1 867.6C710.7 859.4 723.3 851.4 734.9 841.7C737.9 839.2 748.7 830.2 749.6 826.8C750 824.9 749 823.8 748.5 822.1C743 822.3 752.4 820.9 746.7 821.6C744.4 821.9 742.2 823.1 740 823.7C732.8 825.4 723.9 825.2 718.5 819.2C714.7 815 714.5 809.5 715.1 804.1C716.3 793.7 725.7 770.4 734.1 764C737.9 761 742.8 760.4 747.4 761.9C751.9 763.4 755.3 766.8 758 770.6C769 786.6 767.3 809.2 761.9 826.8C758 839.9 750 857.4 738.5 865.7C733.3 869.4 725.9 870.6 719.7 872C707.1 874.8 692.2 878.8 679.5 878.8ZM853.7 873.4C854 873.2 853.7 872.8 853.8 872.6C854 872.3 871.4 861.9 873.4 860.6C884.3 853.4 894.5 845.4 904.6 837.1C908.7 833.7 918.7 826.4 918.3 820.7C918.1 819 917.2 818.5 916.6 817.2C908.8 818.2 902.2 821.7 894.6 816.6C881.4 807.9 895.3 777.9 902.4 768.3C905.8 763.8 910.9 760.1 916.9 761.3C932.8 764.4 935.5 790.3 934.2 803.2C933.5 809.2 932.2 815.1 930.5 820.9C926.8 833.3 916.1 856.2 904.4 862.6C895.1 867.6 864.8 872.5 853.7 873.4ZM914.2 795C912 790.9 912.1 790.9 907.9 789.1C906.8 790.2 904.8 791 904.5 792.8C904.4 793.1 904.8 793.5 904.6 793.8C906.9 794.7 910.9 796.8 913.5 795.7C913.8 795.5 913.9 795.1 914.2 795ZM743 798.7C742.9 798.4 743.4 798.1 743.4 797.8C743.4 794.8 737.8 789.2 734.7 790.8C732.8 791.8 732.7 793.3 731.8 794.8C735.7 797.7 738.2 798.7 743 798.7Z" />
            <path d="M390 725.3Q386.7 721.8 390 718.3L404.6 702.7Q407.9 699.2 411.2 702.7L425.8 718.3Q429.1 721.8 425.8 725.3L411.2 740.9Q407.9 744.4 404.6 740.9ZM824.3 725.2Q821.1 721.7 824.3 718.2L839 702.6Q842.3 699.1 845.5 702.6L860.2 718.2Q863.5 721.7 860.2 725.2L845.5 740.8Q842.3 744.3 839 740.8ZM491.4 844.2Q488.1 840.7 491.4 837.2L506 821.6Q509.3 818.1 512.6 821.6L527.2 837.2Q530.5 840.7 527.2 844.2L512.6 859.8Q509.3 863.3 506 859.8ZM418.4 876.6Q415.1 873.1 418.4 869.6L433 854Q436.3 850.5 439.6 854L454.2 869.6Q457.5 873.1 454.2 876.6L439.6 892.2Q436.3 895.7 433 892.2ZM455.2 876.6Q451.9 873.1 455.2 869.6L469.8 854Q473.1 850.5 476.4 854L491 869.6Q494.3 873.1 491 876.6L476.4 892.2Q473.1 895.7 469.8 892.2Z" />
          </g>
          <g fill="url(#unb-ink-grad)">
            <path fillRule="evenodd" d="M289.6 887.5C298.7 891.8 307.7 897 317.2 901C349.1 914.4 384.2 923 418.6 927C483.2 934.5 545.9 927 609.7 916.7C633.4 912.9 657.1 909.3 680.8 905.3C717.4 899.1 754.1 895 791 891.7C851.8 886.2 920 888.7 977.9 908.8C997.4 915.6 1025.3 927.8 1039.7 942.5C1028.9 938.1 1018.3 933.1 1007.4 929.1C982.1 919.9 955.6 913.3 928.9 909.5C891.4 904.2 853.1 902.4 815.2 904.5C721.5 909.5 629.6 930.3 536.6 940.9C476.5 947.7 413 945.6 355.7 925.4C334.9 918.1 303.8 904.3 289.6 887.5Z" />
          </g>
        </g>
        <g transform="translate(1.0 0)" fill="#6b2f09">
          <path fillRule="evenodd" d="M615.5 961.8Q614 960.1 615.5 958.5L622.3 951.4Q623.8 949.7 625.3 951.4L632.1 958.5Q633.6 960.1 632.1 961.8L625.3 968.9Q623.8 970.5 622.3 968.9Z" />
        </g>
      </g>
    </svg>
  );
}

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Urdu-novel-Bank/100090906471153/",
    icon: FacebookIcon,
  },
  {
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029VaurdEY0wajrnyeAl50Y",
    icon: WhatsAppIcon,
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/bankurdunovel/",
    icon: PinterestIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/urdunovelbank/",
    icon: InstagramIcon,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@urdunovelbank",
    icon: YouTubeIcon,
  },
  {
    label: "Telegram",
    href: "https://t.me/urdunovelbank",
    icon: TelegramIcon,
  },
];

export function SiteHeader() {
  const queryClient = useQueryClient();

  const handlePrefetch = (path: string) => {
    if (path === "/browse") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["feed", "newest", "All"],
        queryFn: ({ pageParam = 0, signal }) =>
          fetchFeed({
            sort: "newest",
            genreId: "All",
            limit: 30,
            offset: (pageParam as number) ?? 0,
            signal,
          }),
        initialPageParam: 0,
      });
    } else if (path === "/leaderboard") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["leaderboard", "all"],
        queryFn: () => fetchLeaderboard("all", 30, 0),
        initialPageParam: 0,
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookHeart className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[15px] font-semibold tracking-tight sm:text-base">Readers&apos;</span>
            <span className="text-[10px] tracking-wide text-muted-foreground sm:text-[11px]">Suggestion Library</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onMouseEnter={() => handlePrefetch(item.to)}
              onFocus={() => handlePrefetch(item.to)}
              className="rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={externalNavItem.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {externalNavItem.label}
            <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
          </a>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary">
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm sm:w-[350px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <BookHeart className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="flex flex-col leading-none">
                    <span className="font-serif text-xl font-semibold">Readers&apos;</span>
                    <span className="text-xs tracking-wide text-muted-foreground">Suggestion Library</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <a
                    href={externalNavItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {externalNavItem.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                  </a>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
      <p className="font-serif italic">Kitaabein dost hoti hain — books are friends.</p>
      <p className="mt-2">
        Made by readers, for readers
      </p>

      {/* Social media icons */}
      <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
          </a>
        ))}
      </div>

      {/* Website links */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm sm:gap-4">
        <a
          href="https://www.urdunovelbanks.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
        >
          Urdu Novel Bank
        </a>
        <span className="text-border" aria-hidden="true">·</span>
        <a
          href="https://urdufictionbank.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
        >
          Urdu Fiction Bank
        </a>
      </div>

      {/* Powered by section */}
      <div className="mt-7 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-2.5">
          <span className="h-px w-6 bg-[#8a400a]/25" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a400a]/80 sm:text-[11px]">
            POWERED BY
          </span>
          <span className="h-px w-6 bg-[#8a400a]/25" aria-hidden="true" />
        </div>
        <a
          href="https://www.urdunovelbanks.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Urdu Novel Bank"
          className="mt-1.5 inline-block transition-all duration-200 hover:opacity-90 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          <UrduNovelBankLogo />
        </a>
      </div>

    </footer>
  );
}

