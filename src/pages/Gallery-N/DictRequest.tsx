import InfoPanel from '@/components/InfoPanel'
import { trackPromotionEvent } from '@/utils/trackEvent'
import { useCallback, useState } from 'react'
import IconBook2 from '~icons/tabler/book-2'

export default function DictRequest() {
  const [showPanel, setShowPanel] = useState(false)

  const onOpenPanel = useCallback(() => {
    setShowPanel(true)
    trackPromotionEvent('promotion_event', {
      from: 'dict_request_button',
      action: 'open',
      action_detail: 'dict_request_button_open',
    })
  }, [])

  const onClosePanel = useCallback(() => {
    setShowPanel(false)
    trackPromotionEvent('promotion_event', {
      from: 'dict_request_panel',
      action: 'close',
      action_detail: 'dict_request_panel_close',
    })
  }, [])

  return (
    <>
      {showPanel && (
        <InfoPanel
          openState={showPanel}
          title="想要添加更多词典？"
          icon={IconBook2}
          buttonClassName="bg-indigo-500 hover:bg-indigo-400"
          iconClassName="text-indigo-500 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500"
          onClose={onClosePanel}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            如果您具备一定的编程技能，欢迎参考我们的词典贡献指引，为我们的词典库贡献新的词典内容。我们非常欢迎社区贡献！
          </p>

          {/* 
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm dark:from-gray-800 dark:to-gray-700">
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">🚀 尝试 QwertyLearner.ai</h4>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                不会编程？想拥有自己的专属学习词典？操作简单，一键上传，点击即用
                <br />
                <div className="my-2"></div>
                那么，推荐您尝试由英国 DeepLearningAI 专业团队开发运营的
                <span className="mx-1 font-semibold text-blue-600 dark:text-blue-400">QwertyLearner.ai</span>
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>AI 智能词库</strong> - 一键上传，智能生成释义和词性，打造专属自定义词库
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>文章练习</strong> - 自定义文章内容，提升实战能力
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>云端同步</strong> - 多设备练习记录、错题库同步
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>词典选择</strong> - 更多丰富的专业词库
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  window.open('https://qwertylearner.ai', '_blank')
                  onClosePanel()
                }}
                className="mt-4 w-full transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                🚀 体验 QwertyLearner.ai
              </button>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <p>
                <strong>说明：</strong>QwertyLearner.ai 由英国 DeepLearningAI 独立开发运营，为 QwertyLearner
                的独立衍生版本，本版本将持续维持开放运营。
              </p>
            </div>
            */}
        </InfoPanel>
      )}
    </>
  )
}
